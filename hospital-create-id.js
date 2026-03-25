// =========================
// FIREBASE CONFIG
// =========================
const firebaseConfig = {
  apiKey: "AIzaSyDtZhr0uHblIoWKAxmXIdeiW5ThvlGmFUg",
  authDomain: "health-care-3944b.firebaseapp.com",
  projectId: "health-care-3944b",
  storageBucket: "health-care-3944b.appspot.com",
  messagingSenderId: "157502935550",
  appId: "1:157502935550:web:e3683dcf20aee195a1f0af"
};

// Firebase init
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();

// =========================
// EMAILJS INIT
// =========================
emailjs.init({
  publicKey: "iI-C_oLgnOppKYY5U"
});

// =========================
// ELEMENTS
// =========================
const form = document.getElementById("createHospitalIdForm");
const messageBox = document.getElementById("messageBox");
const generatedBox = document.getElementById("generatedBox");
const generatedHospitalId = document.getElementById("generatedHospitalId");
const generatedHospitalEmail = document.getElementById("generatedHospitalEmail");

// =========================
// HELPERS
// =========================
function showMessage(message, type) {
  if (!messageBox) return;
  messageBox.className = "message-box " + type;
  messageBox.style.display = "block";
  messageBox.innerHTML = message;
}

function hideMessage() {
  if (!messageBox) return;
  messageBox.style.display = "none";
  messageBox.innerHTML = "";
  messageBox.className = "message-box";
}

function showGeneratedBox(hospitalId, hospitalEmail) {
  if (!generatedBox || !generatedHospitalId || !generatedHospitalEmail) return;
  generatedHospitalId.textContent = hospitalId;
  generatedHospitalEmail.textContent = hospitalEmail;
  generatedBox.style.display = "block";
}

function hideGeneratedBox() {
  if (!generatedBox) return;
  generatedBox.style.display = "none";
}

function generateHospitalId(hospitalName, city) {
  const cleanName = (hospitalName || "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 4) || "HOSP";

  const cleanCity = (city || "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 3) || "CTY";

  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `LC-${cleanName}-${cleanCity}-${randomPart}`;
}

function isValidGmail(email) {
  return /^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(email);
}

function isValidPhone(phone) {
  const cleanPhone = phone.replace(/\D/g, "");
  return cleanPhone.length >= 10;
}

async function sendHospitalCredentialEmail(data) {
  return emailjs.send(
    "service_nt18617",     // yahan apna EmailJS Service ID daalo
    "template_807ol1a",    // yahan apna EmailJS Template ID daalo
    {
      hospital_name: data.hospitalName,
      hospital_email: data.hospitalEmail,
      registration_no: data.registrationNo,
      hospital_id: data.hospitalId,
      password: data.password,
      city: data.city,
      hospital_phone: data.hospitalPhone,
      login_page: "hospital-login.html",
      to_email: data.hospitalEmail
    }
  );
}

// =========================
// FORM SUBMIT
// =========================
if (form) {
  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const hospitalName = document.getElementById("hospitalName")?.value.trim() || "";
    const registrationNo = document.getElementById("registrationNo")?.value.trim() || "";
    const hospitalEmail = document.getElementById("hospitalEmail")?.value.trim().toLowerCase() || "";
    const hospitalPhone = document.getElementById("hospitalPhone")?.value.trim() || "";
    const city = document.getElementById("city")?.value.trim() || "";
    const password = document.getElementById("password")?.value || "";
    const confirmPassword = document.getElementById("confirmPassword")?.value || "";

    hideGeneratedBox();
    hideMessage();

    if (!hospitalName || !registrationNo || !hospitalEmail || !hospitalPhone || !city || !password || !confirmPassword) {
      showMessage("Please fill all required fields.", "error");
      return;
    }

    if (!isValidGmail(hospitalEmail)) {
      showMessage("Please enter a valid Gmail address only.", "error");
      return;
    }

    if (!isValidPhone(hospitalPhone)) {
      showMessage("Please enter a valid phone number.", "error");
      return;
    }

    if (password.length < 6) {
      showMessage("Password must be at least 6 characters.", "error");
      return;
    }

    if (password !== confirmPassword) {
      showMessage("Password and confirm password do not match.", "error");
      return;
    }

    try {
      showMessage("Please wait... hospital account create ho raha hai.", "success");

      const existingByEmail = await db
        .collection("hospitalAccounts")
        .where("hospitalEmail", "==", hospitalEmail)
        .get();

      if (!existingByEmail.empty) {
        showMessage("This hospital Gmail is already registered. Please login or use another email.", "error");
        return;
      }

      const existingByReg = await db
        .collection("hospitalAccounts")
        .where("registrationNo", "==", registrationNo)
        .get();

      if (!existingByReg.empty) {
        showMessage("This registration/licence number is already used.", "error");
        return;
      }

      let hospitalId = generateHospitalId(hospitalName, city);

      const firstCheck = await db.collection("hospitalAccounts").doc(hospitalId).get();
      if (firstCheck.exists) {
        hospitalId = generateHospitalId(hospitalName, city + Date.now());
      }

      const accountData = {
        hospitalId: hospitalId,
        hospitalName: hospitalName,
        registrationNo: registrationNo,
        hospitalEmail: hospitalEmail,
        hospitalPhone: hospitalPhone,
        city: city,
        password: password,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        profileCompleted: false
      };

      await db.collection("hospitalAccounts").doc(hospitalId).set(accountData);

      try {
        await sendHospitalCredentialEmail(accountData);

        showGeneratedBox(hospitalId, hospitalEmail);
        showMessage(
          "Hospital account successfully created. Generated ID aur password details Gmail par send kar di gayi hain.",
          "success"
        );
        form.reset();
      } catch (emailError) {
        console.error("Email send error:", emailError);

        showGeneratedBox(hospitalId, hospitalEmail);
        showMessage(
          "Hospital ID create ho gayi hai, lekin email send nahi ho payi. EmailJS Service ID, Template ID aur template variables check karo.",
          "error"
        );
      }
    } catch (error) {
      console.error("Account create error:", error);
      showMessage("Something went wrong while creating hospital account. " + error.message, "error");
    }
  });
}