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

// Firebase Init
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
const auth = firebase.auth();

// =========================
// LOGIN CHECK
// =========================
auth.onAuthStateChanged((user) => {
  const userName = document.getElementById("userName");

  if (!user) {
    const path = window.location.pathname.toLowerCase();
    const isPublicPage =
      path.includes("index.html") ||
      path.includes("login.html") ||
      path.includes("signup.html") ||
      path.includes("hospital-search.html") ||
      path.endsWith("/");

    if (!isPublicPage) {
      window.location.href = "/collage-project/index.html";
    }
    return;
  }

  if (userName) {
    userName.innerText =
      user.displayName ||
      user.email ||
      user.phoneNumber ||
      "User";
  }
});

// =========================
// LOGOUT
// =========================
function logout() {
  auth.signOut()
    .then(() => {
      window.location.href = "/collage-project/index.html";
    })
    .catch((error) => {
      alert("Logout failed: " + error.message);
    });
}

// =========================
// PROFILE TOGGLE
// =========================
function toggleProfile() {
  const box = document.getElementById("profileBox");
  if (box) {
    box.style.display = box.style.display === "block" ? "none" : "block";
  }
}

document.addEventListener("click", function (e) {
  const profileBox = document.getElementById("profileBox");
  const profileBtn = document.querySelector(".profile");

  if (
    profileBox &&
    profileBtn &&
    !profileBox.contains(e.target) &&
    !profileBtn.contains(e.target)
  ) {
    profileBox.style.display = "none";
  }
});

// =========================
// REGISTER DONOR
// =========================
function registerDonor() {
  const fullNameEl = document.getElementById("fullname") || document.getElementById("name");
  const ageEl = document.getElementById("age");
  const genderEl = document.getElementById("gender");
  const bloodEl = document.getElementById("bloodgroup") || document.getElementById("blood");
  const phoneEl = document.getElementById("phone");
  const emailEl = document.getElementById("email");
  const cityEl = document.getElementById("city");
  const addressEl = document.getElementById("address");
  const messageEl = document.getElementById("message");
  const statusMessage = document.getElementById("statusMessage");

  if (!fullNameEl || !bloodEl || !phoneEl || !cityEl) return;

  const donorData = {
    name: fullNameEl.value.trim(),
    age: ageEl ? ageEl.value.trim() : "",
    gender: genderEl ? genderEl.value : "",
    blood: bloodEl.value.trim(),
    phone: phoneEl.value.trim(),
    email: emailEl ? emailEl.value.trim() : "",
    city: cityEl.value.trim(),
    address: addressEl ? addressEl.value.trim() : "",
    message: messageEl ? messageEl.value.trim() : "",
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    createdAtText: new Date().toLocaleString("en-IN")
  };

  if (
    !donorData.name ||
    !donorData.phone ||
    !donorData.city ||
    !donorData.blood ||
    donorData.blood === "Select Blood"
  ) {
    if (statusMessage) {
      statusMessage.style.color = "red";
      statusMessage.innerText = "Please fill all required fields.";
    } else {
      alert("Please fill all required fields.");
    }
    return;
  }

  db.collection("donors")
    .add(donorData)
    .then(() => {
      if (statusMessage) {
        statusMessage.style.color = "green";
        statusMessage.innerText = "Donor registered successfully ✅";
      } else {
        alert("Donor Registered ✅");
      }

      fullNameEl.value = "";
      if (ageEl) ageEl.value = "";
      if (genderEl) genderEl.value = "";
      bloodEl.value = "";
      phoneEl.value = "";
      if (emailEl) emailEl.value = "";
      cityEl.value = "";
      if (addressEl) addressEl.value = "";
      if (messageEl) messageEl.value = "";
    })
    .catch((error) => {
      if (statusMessage) {
        statusMessage.style.color = "red";
        statusMessage.innerText = "Error: " + error.message;
      } else {
        alert("Error: " + error.message);
      }
    });
}

// =========================
// SEARCH DONOR
// =========================
function searchDonor() {
  const bloodEl = document.getElementById("searchBlood");
  const nameEl = document.getElementById("searchName");
  const cityEl = document.getElementById("searchCity");
  const table = document.getElementById("table");
  const donorContainer = document.getElementById("donorContainer");

  const searchBlood = bloodEl ? bloodEl.value.trim().toLowerCase() : "none";
  const searchName = nameEl ? nameEl.value.toLowerCase().trim() : "";
  const searchCity = cityEl ? cityEl.value.toLowerCase().trim() : "";

  db.collection("donors")
    .get()
    .then((snapshot) => {
      if (table) {
        table.innerHTML = `
          <tr>
            <th>Name</th>
            <th>Phone</th>
            <th>Blood</th>
            <th>City</th>
            <th>Contact</th>
          </tr>
        `;
      }

      if (donorContainer) donorContainer.innerHTML = "";

      if (snapshot.empty) {
        if (table) {
          table.innerHTML += `<tr><td colspan="5">No donors found ❌</td></tr>`;
        }
        if (donorContainer) {
          donorContainer.innerHTML = `<div class="empty">No donors found ❌</div>`;
        }
        return;
      }

      // NONE selected => kuchh bhi show mat karo
      if (searchBlood === "none") {
        if (table) {
          table.innerHTML += `<tr><td colspan="5">Please select a blood group or choose All Blood Groups.</td></tr>`;
        }
        if (donorContainer) {
          donorContainer.innerHTML = `<div class="empty">Please select a blood group or choose All Blood Groups.</div>`;
        }
        return;
      }

      let found = false;

      snapshot.forEach((doc) => {
        const d = doc.data();

        const donorName = (d.name || d.fullname || "").toLowerCase();
        const donorCity = (d.city || "").toLowerCase();
        const donorBlood = (d.blood || d.bloodgroup || "").trim().toLowerCase();
        const phone = d.phone || "";
        const cleanPhone = phone.replace(/[^0-9]/g, "");

        const matchBlood =
          searchBlood === "all"
            ? true
            : donorBlood === searchBlood;

        const matchName = !searchName || donorName.includes(searchName);
        const matchCity = !searchCity || donorCity.includes(searchCity);

        if (matchBlood && matchName && matchCity) {
          found = true;

          if (table) {
            table.innerHTML += `
              <tr>
                <td>${d.name || d.fullname || "N/A"}</td>
                <td>${d.phone || "N/A"}</td>
                <td>${d.blood || d.bloodgroup || "N/A"}</td>
                <td>${d.city || "N/A"}</td>
                <td>
                  <a href="tel:${phone}" style="text-decoration:none;">📞</a>
                  &nbsp;
                  <a href="https://wa.me/91${cleanPhone}" target="_blank" style="text-decoration:none;">🟢</a>
                </td>
              </tr>
            `;
          }

          if (donorContainer) {
            donorContainer.innerHTML += `
              <div class="donor-card">
                <div class="donor-top">
                  <div class="donor-name">${d.name || d.fullname || "No Name"}</div>
                  <div class="blood-badge">${d.blood || d.bloodgroup || "N/A"}</div>
                </div>

                <div class="donor-info">
                  <p><strong>Phone:</strong> ${d.phone || "N/A"}</p>
                  <p><strong>City:</strong> ${d.city || "N/A"}</p>
                  <p><strong>Age:</strong> ${d.age || "N/A"}</p>
                  <p><strong>Gender:</strong> ${d.gender || "N/A"}</p>
                  <p><strong>Email:</strong> ${d.email || "N/A"}</p>
                  <p><strong>Address:</strong> ${d.address || "N/A"}</p>
                </div>

                <div class="actions">
                  <a class="action-btn call-btn" href="tel:${phone}">📞 Call</a>
                  <a class="action-btn wa-btn" href="https://wa.me/91${cleanPhone}" target="_blank">🟢 WhatsApp</a>
                </div>
              </div>
            `;
          }
        }
      });

      if (!found) {
        if (table) {
          table.innerHTML += `<tr><td colspan="5">No matching donors found ❌</td></tr>`;
        }
        if (donorContainer) {
          donorContainer.innerHTML = `<div class="empty">No matching donors found ❌</div>`;
        }
      }
    })
    .catch((error) => {
      if (table) {
        table.innerHTML = `<tr><td colspan="5">Error: ${error.message}</td></tr>`;
      }
      if (donorContainer) {
        donorContainer.innerHTML = `<div class="empty">Error: ${error.message}</div>`;
      }
    });
}

// =========================
// CHATBOT HELPERS
// =========================
function escapeHTML(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function hasAny(text, arr) {
  return arr.some(word => text.includes(word));
}

function countMatches(text, keywords) {
  let count = 0;
  for (const keyword of keywords) {
    if (text.includes(keyword)) count++;
  }
  return count;
}

function normalizeMedicalText(text) {
  let t = text.toLowerCase();

  t = t.replace(/[^\w\s]/g, " ");
  t = t.replace(/\s+/g, " ").trim();

  const replacements = [
    ["mujhe", ""],
    ["mere", ""],
    ["mera", ""],
    ["hai", ""],
    ["ho raha", ""],
    ["ho rahi", ""],
    ["ho raha hai", ""],
    ["ho rahi hai", ""],
    ["tej bukhar", "high fever"],
    ["bahut bukhar", "high fever"],
    ["bohot bukhar", "high fever"],
    ["jyada bukhar", "high fever"],
    ["zyada bukhar", "high fever"],
    ["bukhaar", "fever"],
    ["bukhar", "fever"],
    ["temperature", "fever"],
    ["sardi jukam", "cold cough"],
    ["jukaam", "cold"],
    ["jukam", "cold"],
    ["zukaam", "cold"],
    ["sardi", "cold"],
    ["naak behna", "runny nose"],
    ["naak bahna", "runny nose"],
    ["naak band", "nasal congestion"],
    ["khansi", "cough"],
    ["khaasi", "cough"],
    ["balgam", "phlegm"],
    ["sir dard", "headache"],
    ["sar dard", "headache"],
    ["sir me dard", "headache"],
    ["sir mein dard", "headache"],
    ["aadha sir dard", "migraine"],
    ["chakkar", "dizziness"],
    ["pet dard", "stomach pain"],
    ["pet me dard", "stomach pain"],
    ["pet mein dard", "stomach pain"],
    ["pet me jalan", "acidity"],
    ["pet mein jalan", "acidity"],
    ["gas", "acidity"],
    ["pet kharab", "stomach problem"],
    ["ulti", "vomiting"],
    ["ulti aa rahi", "vomiting"],
    ["ulti ho rahi", "vomiting"],
    ["man ghabra raha", "nausea"],
    ["man ghabrana", "nausea"],
    ["dast", "diarrhea"],
    ["loose motion", "diarrhea"],
    ["bar bar motion", "diarrhea"],
    ["baar baar motion", "diarrhea"],
    ["kabz", "constipation"],
    ["gale me dard", "sore throat"],
    ["gale mein dard", "sore throat"],
    ["gala dard", "sore throat"],
    ["gala kharab", "sore throat"],
    ["gala pak gaya", "throat infection"],
    ["saans lene me dikkat", "shortness of breath"],
    ["saans lene mein dikkat", "shortness of breath"],
    ["sans lene me dikkat", "shortness of breath"],
    ["saans phoolna", "shortness of breath"],
    ["sans phoolna", "shortness of breath"],
    ["seene me dard", "chest pain"],
    ["seene mein dard", "chest pain"],
    ["chati me dard", "chest pain"],
    ["kamjori", "weakness"],
    ["kamzori", "weakness"],
    ["thakan", "fatigue"],
    ["peshab me jalan", "burning urination"],
    ["peshab mein jalan", "burning urination"],
    ["bar bar peshab", "frequent urination"],
    ["baar baar peshab", "frequent urination"],
    ["khujli", "itching"],
    ["daane", "rash"],
    ["kaan dard", "ear pain"],
    ["aankh lal", "red eye"],
    ["aankh me jalan", "eye irritation"],
    ["aankh mein jalan", "eye irritation"],
    ["jodo me dard", "joint pain"],
    ["jodo mein dard", "joint pain"],
    ["ghutno me dard", "knee pain"],
    ["ghutno mein dard", "knee pain"],
    ["body pain", "body ache"],
    ["body ache", "body ache"],
    ["mahavari", "period"],
    ["period pain", "menstrual cramps"],
    ["sugar", "diabetes"],
    ["bp", "blood pressure"]
  ];

  for (const [from, to] of replacements) {
    const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "g");
    t = t.replace(regex, to);
  }

  t = t.replace(/\s+/g, " ").trim();
  return t;
}

function formatReply(title, possible, care, tests, doctorWhen, emergency) {
  return `
    <div class="bot-reply">
      <strong>${title}</strong><br><br>
      <strong>Possible problem:</strong><br>
      ${possible}<br><br>

      <strong>Abhi kya kare:</strong><br>
      ${care}<br><br>

      <strong>Kaunsi tests / janch useful ho sakti hain:</strong><br>
      ${tests}<br><br>

      <strong>Doctor ko kab dikhana chahiye:</strong><br>
      ${doctorWhen}<br><br>

      <strong>Emergency warning signs:</strong><br>
      ${emergency}<br><br>

      <small>
        Note: Ye chatbot general health information deta hai. Final diagnosis ke liye doctor se consult karo.
      </small>
    </div>
  `;
}

// =========================
// MEDICAL KNOWLEDGE BASE
// =========================
const medicalKnowledge = [
  {
    title: "🤒 Fever / Viral / Flu",
    keywords: ["fever", "high fever", "viral fever", "flu", "chills", "body ache", "cold", "cough"],
    possible: "Ye viral fever, flu, cold ya kisi infection ki wajah se ho sakta hai.",
    care: "Rest karo, fluids lo, warm water piyo, light diet lo, fever monitor karo.",
    tests: "CBC, temperature check, doctor ke kehne par dengue, malaria ya flu/COVID test.",
    doctorWhen: "Agar fever 2-3 din se zyada rahe, bahut weakness ho, ya cough/saans ki problem ho.",
    emergency: "Very high fever, confusion, dehydration, breathing issue, severe weakness."
  },
  {
    title: "😷 Cold / Cough / Throat Infection",
    keywords: ["cold", "cough", "phlegm", "runny nose", "nasal congestion", "sore throat", "throat infection"],
    possible: "Ye common cold, throat infection, viral infection ya allergy ho sakta hai.",
    care: "Warm water piyo, steam lo, dust/smoke avoid karo, rest karo.",
    tests: "CBC, throat check, chest checkup, doctor ke kehne par chest X-ray ya infection test.",
    doctorWhen: "Agar cough 1-2 weeks se zyada rahe, fever ho, ya gale me zyada pain ho.",
    emergency: "Breathing issue, blood in cough, severe chest tightness."
  },
  {
    title: "🤕 Headache / Migraine / Dizziness",
    keywords: ["headache", "migraine", "dizziness", "head pain", "light sensitivity"],
    possible: "Ye normal headache, migraine, dehydration, low sleep, stress ya BP issue ho sakta hai.",
    care: "Rest karo, paani piyo, light kam karo, screen time kam rakho.",
    tests: "BP check, eye check, CBC, sugar test; repeated problem me doctor further tests suggest karega.",
    doctorWhen: "Agar baar-baar ho, bahut severe ho, ya vomiting/vision problem ke saath ho.",
    emergency: "Sudden severe headache, fainting, body ek side weak hona, confusion."
  },
  {
    title: "🫃 Stomach Pain / Acidity / Gas",
    keywords: ["stomach pain", "stomach problem", "acidity", "indigestion", "bloating", "constipation"],
    possible: "Ye acidity, gas, indigestion, constipation ya stomach irritation ki wajah se ho sakta hai.",
    care: "Spicy food avoid karo, light khana khao, paani piyo, rest karo.",
    tests: "CBC, stool test, urine test, ultrasound abdomen if needed.",
    doctorWhen: "Agar pain severe ho, repeat ho, ya vomiting/fever ke saath ho.",
    emergency: "Sudden severe pain, blood in stool/vomit, pet bahut hard lagna."
  },
  {
    title: "🚽 Diarrhea / Loose Motion",
    keywords: ["diarrhea", "watery stool", "food poisoning"],
    possible: "Ye stomach infection, food poisoning ya unsafe food-water ki wajah se ho sakta hai.",
    care: "ORS lo, paani zyada piyo, light food lo, dehydration avoid karo.",
    tests: "Stool test, CBC, electrolytes, doctor ke kehne par infection tests.",
    doctorWhen: "Agar 1-2 din se zyada rahe, fever ho, ya weakness ho.",
    emergency: "Blood in stool, severe dehydration, fainting, urine bahut kam aana."
  },
  {
    title: "🤢 Vomiting / Nausea",
    keywords: ["vomiting", "nausea"],
    possible: "Ye food poisoning, acidity, infection, migraine ya stomach problem se ho sakta hai.",
    care: "ORS lo, chhote sips me paani lo, oily food avoid karo, rest karo.",
    tests: "CBC, electrolytes, urine test, stool test.",
    doctorWhen: "Agar baar-baar ulti ho rahi ho ya kuchh pet me na ruk raha ho.",
    emergency: "Vomiting blood, severe dehydration, confusion, severe stomach pain."
  },
  {
    title: "🚻 Urine Infection / UTI",
    keywords: ["burning urination", "frequent urination", "uti", "urine infection"],
    possible: "Ye urine infection ya UTI ka sign ho sakta hai.",
    care: "Paani zyada piyo, urine mat roko, hygiene maintain karo.",
    tests: "Urine routine, urine culture, CBC, sugar test.",
    doctorWhen: "Agar burning ke saath fever ho, back pain ho, ya repeated problem ho.",
    emergency: "High fever, vomiting, severe back pain."
  },
  {
    title: "🌿 Allergy / Rash / Itching",
    keywords: ["allergy", "rash", "itching", "red eye", "eye irritation"],
    possible: "Ye skin allergy, irritation, mild infection ya reaction ho sakta hai.",
    care: "Trigger cheez avoid karo, scratch mat karo, skin clean rakho.",
    tests: "Skin exam, CBC, allergy test doctor suggest kar sakta hai.",
    doctorWhen: "Agar rash spread ho raha ho ya repeat ho raha ho.",
    emergency: "Face swelling, breathing issue, severe allergic reaction."
  },
  {
    title: "😴 Weakness / Fatigue",
    keywords: ["weakness", "fatigue", "low energy", "tired"],
    possible: "Ye poor sleep, stress, anemia, viral illness, low sugar ya deficiency se ho sakta hai.",
    care: "Proper sleep lo, paani piyo, balanced diet lo, overwork avoid karo.",
    tests: "CBC, sugar test, BP check, thyroid, vitamin B12, vitamin D.",
    doctorWhen: "Agar daily weakness ho ya 1-2 weeks se zyada rahe.",
    emergency: "Fainting, chest pain, confusion, severe breathing issue."
  },
  {
    title: "🦴 Joint Pain / Body Ache / Back Pain",
    keywords: ["joint pain", "knee pain", "body ache", "muscle pain", "back pain", "neck pain"],
    possible: "Ye overwork, strain, posture issue, viral illness ya deficiency ki wajah se ho sakta hai.",
    care: "Rest karo, hydration lo, overstrain mat karo.",
    tests: "CBC, vitamin D, calcium, ESR/CRP, X-ray if needed.",
    doctorWhen: "Agar pain repeat ho, swelling ho, ya movement difficult ho.",
    emergency: "Sudden severe swelling, high fever, joint move na hona."
  },
  {
    title: "🩸 Diabetes / High Sugar Possibility",
    keywords: ["diabetes", "high sugar", "excess thirst", "frequent urination", "blurred vision"],
    possible: "Ye blood sugar problem ka sign ho sakta hai.",
    care: "Sugar intake control karo, regular meals lo, paani piyo.",
    tests: "Fasting sugar, PP sugar, HbA1c, urine test.",
    doctorWhen: "Agar repeated symptoms ho.",
    emergency: "Confusion, vomiting, severe weakness, dehydration."
  },
  {
    title: "🫨 BP / Dizziness Problem",
    keywords: ["blood pressure", "high bp", "low bp", "dizziness", "palpitations"],
    possible: "Ye BP issue, weakness, dehydration ya stress se related ho sakta hai.",
    care: "Baith jao, paani piyo, achanak mat uthho, BP check karao.",
    tests: "BP check, sugar test, CBC, ECG if needed.",
    doctorWhen: "Agar dizziness baar-baar ho ya chest pain ke saath ho.",
    emergency: "Behoshi, chest pain, breathing issue, confusion."
  },
  {
  title: "🦟 Dengue / Malaria",
  keywords: ["dengue", "malaria", "platelet"],
  possible: "Ye mosquito se failne wali serious infection ho sakti hai. Dengue me platelet count kam ho sakta hai aur malaria me chills aur fever aata hai.",
  care: `
  ✔ Complete rest lo  
  ✔ Paani, ORS, coconut water zyada piyo  
  ✔ Light aur liquid diet lo  
  ✔ Doctor ki medicine time par lo  

  ❌ Painkiller bina doctor ke mat lo (especially ibuprofen)  
  ❌ Dehydration bilkul mat hone do  
  `,
  tests: "CBC, Platelet count, Dengue NS1, Malaria test",
  doctorWhen: "High fever 2 din se zyada rahe ya weakness badh rahi ho",
  emergency: "Platelet bahut kam ho jana, bleeding, severe vomiting, behoshi"
},

{
  title: "❤️ Heart Problem",
  keywords: ["chest pain", "heart"],
  possible: "Ye heart se related serious problem ho sakti hai jaise heart attack ya blockage.",
  care: `
  ✔ Turant rest karo aur hilna mat  
  ✔ Aspirin (doctor ki salah se) li ja sakti hai  
  ✔ Emergency service ko call karo  

  ❌ Ignore mat karo  
  ❌ Self-treatment mat karo  
  `,
  tests: "ECG, Troponin test, Blood test",
  doctorWhen: "Chest pain ya pressure feel ho",
  emergency: "Left arm pain, sweating, breathing issue = immediate emergency"
},

{
  title: "🧠 Stroke",
  keywords: ["stroke", "paralysis"],
  possible: "Brain me blood flow rukne ya clot hone ki wajah se stroke ho sakta hai.",
  care: `
  ✔ Turant hospital le jao (golden time 3-4 hours hota hai)  
  ✔ Patient ko seedha litao  

  ❌ Time waste mat karo  
  ❌ Ghar par treatment mat karo  
  `,
  tests: "CT scan, MRI",
  doctorWhen: "Face tedha ho, bolne me dikkat ho",
  emergency: "Body ka ek side kaam na kare, speech loss"
},

{
  title: "🫁 Asthma",
  keywords: ["asthma", "breathing"],
  possible: "Ye lungs ki problem hai jisme saans lene me dikkat hoti hai.",
  care: `
  ✔ Inhaler use karo (doctor ke according)  
  ✔ Dust, smoke avoid karo  
  ✔ Warm environment me raho  

  ❌ Cold air exposure avoid karo  
  ❌ Smoking bilkul mat karo  
  `,
  tests: "Spirometry, lung test",
  doctorWhen: "Bar bar breathing problem ho",
  emergency: "Saans bilkul na aa paaye"
},

{
  title: "🧠 Stress / Anxiety",
  keywords: ["stress", "anxiety"],
  possible: "Ye mental health problem hai jo overthinking, tension aur sleep issues se hoti hai.",
  care: `
  ✔ Meditation aur deep breathing karo  
  ✔ Daily exercise karo  
  ✔ Kisi trusted person se baat karo  

  ❌ Akela mat raho  
  ❌ Negative thinking me mat faso  
  `,
  tests: "Psychological evaluation",
  doctorWhen: "Daily life affect ho",
  emergency: "Severe panic attack, control na ho"
},

{
  title: "🦷 Tooth Pain",
  keywords: ["tooth pain", "daant dard"],
  possible: "Ye cavity, infection ya gum problem ki wajah se ho sakta hai.",
  care: `
  ✔ Brush aur oral hygiene maintain karo  
  ✔ Warm salt water se gargle karo  

  ❌ Bahut thanda ya garam avoid karo  
  ❌ Pain ignore mat karo  
  `,
  tests: "Dental X-ray",
  doctorWhen: "Pain continue rahe",
  emergency: "Face swelling ya severe pain"
},

{
  title: "👁️ Eye Problem",
  keywords: ["eye pain", "red eye"],
  possible: "Eye infection, allergy ya irritation ho sakta hai.",
  care: `
  ✔ Eyes clean rakho  
  ✔ Screen time kam karo  

  ❌ Eyes rub mat karo  
  ❌ Dirty hands se touch mat karo  
  `,
  tests: "Eye checkup",
  doctorWhen: "Blurred vision ho",
  emergency: "Sudden vision loss"
},

{
  title: "👂 Ear Problem",
  keywords: ["ear pain"],
  possible: "Ear infection ya wax blockage ho sakta hai.",
  care: `
  ✔ Ear clean aur dry rakho  

  ❌ Ear me kuch insert mat karo  
  ❌ Self cleaning avoid karo  
  `,
  tests: "Ear exam",
  doctorWhen: "Pain continue ho",
  emergency: "Hearing loss"
},

{
  title: "🌿 Skin Problem",
  keywords: ["itching", "fungal"],
  possible: "Fungal infection ya allergy ho sakti hai.",
  care: `
  ✔ Skin clean aur dry rakho  
  ✔ Cotton clothes pehno  

  ❌ Scratch mat karo  
  ❌ Tight clothes avoid karo  
  `,
  tests: "Skin test",
  doctorWhen: "Spread ho raha ho",
  emergency: "Severe infection"
},

{
  title: "🩸 Diabetes",
  keywords: ["diabetes", "sugar"],
  possible: "Blood sugar level high hone ki condition hai.",
  care: `
  ✔ Sugar control diet lo  
  ✔ Regular exercise karo  

  ❌ Meetha zyada mat khao  
  ❌ Medicine skip mat karo  
  `,
  tests: "Fasting sugar, HbA1c",
  doctorWhen: "Regular monitoring zaruri hai",
  emergency: "Very high sugar, confusion"
},

{
  title: "🫃 Stomach Problem",
  keywords: ["stomach pain", "gas"],
  possible: "Acidity, gas ya digestion problem ho sakti hai.",
  care: `
  ✔ Light aur healthy food lo  
  ✔ Paani zyada piyo  

  ❌ Junk food avoid karo  
  ❌ Overeating mat karo  
  `,
  tests: "Basic tests",
  doctorWhen: "Pain repeat ho",
  emergency: "Severe stomach pain"
}
  
];

// =========================
// EMERGENCY CHECK
// =========================
function getEmergencyReply(msg) {
  const emergencyKeywords = [
    "chest pain",
    "shortness of breath",
    "not able to breathe",
    "unconscious",
    "fainting",
    "severe bleeding",
    "vomiting blood",
    "blood in vomit",
    "black stool",
    "seizure",
    "fits",
    "confusion",
    "one side weakness",
    "heart attack",
    "stroke"
  ];

  if (hasAny(msg, emergencyKeywords)) {
    return formatReply(
      "⚠️ Urgent Medical Alert",
      "Ye serious emergency ho sakti hai.",
      "Turant nearest hospital ya emergency service se contact karo. Delay mat karo.",
      "Doctor ECG, BP, oxygen level, CBC, X-ray, CT scan ya aur urgent tests kara sakta hai.",
      "Doctor ko turant dikhana chahiye.",
      "Chest pain, breathing issue, behoshi, confusion, severe bleeding = emergency."
    );
  }

  return null;
}

// =========================
// CHATBOT REPLY ENGINE
// =========================
function getMedicalReply(msg) {
  const emergencyReply = getEmergencyReply(msg);
  if (emergencyReply) return emergencyReply;

  if (hasAny(msg, ["blood donor", "donor", "blood needed", "blood chahiye"])) {
    return `
      <div class="bot-reply">
        <strong>🩸 Blood Donor Help</strong><br><br>
        Donor section me jaakar blood group, city ya name search karo.<br><br>
        Emergency blood requirement ho to nearest hospital blood bank bhi contact karo.
      </div>
    `;
  }

  let bestMatch = null;
  let bestScore = 0;

  for (const item of medicalKnowledge) {
    const score = countMatches(msg, item.keywords);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = item;
    }
  }

  if (bestMatch && bestScore >= 1) {
    return formatReply(
      bestMatch.title,
      bestMatch.possible,
      bestMatch.care,
      bestMatch.tests,
      bestMatch.doctorWhen,
      bestMatch.emergency
    );
  }

  return `
    <div class="bot-reply">
      <strong>👨‍⚕️ Health Assistant</strong><br><br>
      Mujhe apne symptoms aur clearly batao.<br><br>

      <strong>Example:</strong><br>
      • mujhe tej bukhar hai<br>
      • mere pet me dard aur ulti ho rahi hai<br>
      • I have headache and dizziness<br>
      • burning urination and fever<br>
      • cough with sore throat<br><br>

      Main possible problem, kya kare, tests aur doctor ko kab dikhana hai bata dunga.
    </div>
  `;
}

// =========================
// CHATBOT MAIN
// =========================
function askAI() {
  const input = document.getElementById("question");
  const chatBox = document.getElementById("chatBox");

  if (!input || !chatBox) return;

  const userMsg = input.value.trim();
  if (!userMsg) return;

  const normalizedMsg = normalizeMedicalText(userMsg);

  chatBox.innerHTML += `
    <div class="message user">
      <span>${escapeHTML(userMsg)}</span>
    </div>
  `;

  const typingId = "typing" + Date.now();

  chatBox.innerHTML += `
    <div class="message bot" id="${typingId}">
      <img src="https://cdn-icons-png.flaticon.com/512/3774/3774299.png" alt="bot">
      <span class="typing">Doctor is typing...</span>
    </div>
  `;

  chatBox.scrollTop = chatBox.scrollHeight;

  setTimeout(() => {
    const reply = getMedicalReply(normalizedMsg);

    const typingDiv = document.getElementById(typingId);
    if (typingDiv) typingDiv.remove();

    chatBox.innerHTML += `
      <div class="message bot">
        <img src="https://cdn-icons-png.flaticon.com/512/3774/3774299.png" alt="bot">
        <span>${reply}</span>
      </div>
    `;

    chatBox.scrollTop = chatBox.scrollHeight;
  }, 700);

  input.value = "";
}

// =========================
// VOICE INPUT
// =========================
function startVoice() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert("Voice recognition is not supported in this browser.");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "en-IN";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.start();

  recognition.onresult = function (event) {
    const text = event.results[0][0].transcript;
    const questionInput = document.getElementById("question");
    if (questionInput) {
      questionInput.value = text;
    }
  };

  recognition.onerror = function () {
    alert("Voice input failed. Please try again.");
  };
}

// =========================
// COMMON HELPERS FOR HOSPITALS
// =========================
function normalizeCity(city) {
  return (city || "").trim();
}

function getHospitalName(data) {
  return data.hospitalName || data.name || data.hospital || "Unnamed Hospital";
}

function getHospitalRating(data) {
  return data.rating || "4.5";
}

function getHospitalAddress(data) {
  return data.address || data.location || "Address not available";
}

function getHospitalSpeciality(data) {
  return data.speciality || data.specialties || data.specialization || "General Care";
}

// =========================
// HOME PAGE CITY DROPDOWN
// =========================
async function loadHospitalCities() {
  const cityFilter = document.getElementById("cityFilter");
  const cityTags = document.getElementById("cityTags");

  if (!cityFilter) return;

  try {
    const snapshot = await db.collection("hospitals").get();
    const citySet = new Set();

    snapshot.forEach((doc) => {
      const data = doc.data();
      const city = normalizeCity(data.city);
      if (city) citySet.add(city);
    });

    const cities = Array.from(citySet).sort((a, b) => a.localeCompare(b));

    if (!cities.length) {
      cityFilter.innerHTML = `<option value="">No registered city found</option>`;
      if (cityTags) {
        cityTags.innerHTML = `<span class="city-tag">No registered cities found</span>`;
      }
      return;
    }

    cityFilter.innerHTML = `
      <option value="All Cities">All Cities</option>
      ${cities.map(city => `<option value="${city}">${city}</option>`).join("")}
    `;

    if (cityTags) {
      cityTags.innerHTML = `
        <span class="city-tag">All Cities</span>
        ${cities.map(city => `<span class="city-tag">${city}</span>`).join("")}
      `;
    }
  } catch (error) {
    console.error("Error loading hospital cities:", error);
    cityFilter.innerHTML = `<option value="">Unable to load cities</option>`;
    if (cityTags) {
      cityTags.innerHTML = `<span class="city-tag">Unable to load cities</span>`;
    }
  }
}

function goToHospitalSearch() {
  const cityFilter = document.getElementById("cityFilter");
  if (!cityFilter) return;

  const selectedCity = cityFilter.value;

  if (!selectedCity) {
    alert("Please select a city first.");
    return;
  }

  window.location.href = `hospital-search.html?city=${encodeURIComponent(selectedCity)}`;
}

// =========================
// SEARCH PAGE CITY FILTER
// =========================
async function loadSearchPageCities(selectedCityFromUrl = "All Cities") {
  const searchCityFilter = document.getElementById("searchCityFilter");
  if (!searchCityFilter) return;

  try {
    const snapshot = await db.collection("hospitals").get();
    const citySet = new Set();

    snapshot.forEach((doc) => {
      const data = doc.data();
      const city = normalizeCity(data.city);
      if (city) citySet.add(city);
    });

    const cities = Array.from(citySet).sort((a, b) => a.localeCompare(b));

    searchCityFilter.innerHTML = `
      <option value="All Cities">All Cities</option>
      ${cities.map(city => `<option value="${city}">${city}</option>`).join("")}
    `;

    const validCities = ["All Cities", ...cities];
    if (validCities.includes(selectedCityFromUrl)) {
      searchCityFilter.value = selectedCityFromUrl;
    } else {
      searchCityFilter.value = "All Cities";
    }
  } catch (error) {
    console.error("Error loading search page cities:", error);
    searchCityFilter.innerHTML = `<option value="">Unable to load cities</option>`;
  }
}

function applyCityFilter() {
  const searchCityFilter = document.getElementById("searchCityFilter");
  if (!searchCityFilter) return;

  const selectedCity = searchCityFilter.value || "All Cities";
  window.location.href = `hospital-search.html?city=${encodeURIComponent(selectedCity)}`;
}

async function loadHospitalsByCity() {
  const hospitalList = document.getElementById("searchHospitalList");
  const resultHeading = document.getElementById("resultHeading");
  const urlParams = new URLSearchParams(window.location.search);
  const cityFromUrl = urlParams.get("city") || "All Cities";

  if (!hospitalList || !resultHeading) return;

  await loadSearchPageCities(cityFromUrl);

  const searchCityFilter = document.getElementById("searchCityFilter");
  const selectedCity = searchCityFilter ? searchCityFilter.value : cityFromUrl;

  try {
    hospitalList.innerHTML = `<div class="empty-box">Loading hospitals...</div>`;

    const snapshot = await db.collection("hospitals").get();
    const hospitals = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      const hospitalCity = normalizeCity(data.city);

      if (
        selectedCity === "All Cities" ||
        hospitalCity.toLowerCase() === selectedCity.toLowerCase()
      ) {
        hospitals.push({
          id: doc.id,
          ...data
        });
      }
    });

    hospitals.sort((a, b) => getHospitalName(a).localeCompare(getHospitalName(b)));

    if (selectedCity === "All Cities") {
      resultHeading.textContent = `Showing All Registered Hospitals (${hospitals.length})`;
    } else {
      resultHeading.textContent = `Showing Hospitals in ${selectedCity} (${hospitals.length})`;
    }

    if (!hospitals.length) {
      hospitalList.innerHTML = `
        <div class="empty-box">
          No registered hospitals found for <strong>${selectedCity}</strong>.
        </div>
      `;
      return;
    }

    hospitalList.innerHTML = hospitals.map((hospital) => {
      const name = getHospitalName(hospital);
      const city = hospital.city || "N/A";
      const rating = getHospitalRating(hospital);
      const address = getHospitalAddress(hospital);
      const speciality = getHospitalSpeciality(hospital);

      return `
        <div class="hospital-card">
          <h3>${name}</h3>
          <p><strong>City:</strong> ${city}</p>
          <p><strong>Speciality:</strong> ${speciality}</p>
          <p><strong>Address:</strong> ${address}</p>
          <span class="rating-badge">⭐ ${rating} / 5</span><br>
          <a class="view-btn" href="hospital-details.html?id=${hospital.id}">View Details</a>
        </div>
      `;
    }).join("");
  } catch (error) {
    console.error("Error loading hospitals by city:", error);
    resultHeading.textContent = "Unable to load hospitals";
    hospitalList.innerHTML = `
      <div class="empty-box">
        Something went wrong while loading hospitals.
      </div>
    `;
  }
}

// =========================
// LOCATION + FREE MAP + HOSPITAL SEARCH
// =========================
let map = null;
let userMarker = null;
let searchCircle = null;
let hospitalMarkers = [];

function initLeafletMap() {
  const mapElement = document.getElementById("map");
  if (!mapElement || typeof L === "undefined") return;

  if (map) return;

  map = L.map("map").setView([26.9124, 75.7873], 7);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);
}

function clearHospitalMarkers() {
  hospitalMarkers.forEach(marker => {
    if (map) map.removeLayer(marker);
  });
  hospitalMarkers = [];
}

function getLocation() {
  const status = document.getElementById("locationStatus");
  const hospitalList = document.getElementById("hospitalList");

  if (!status || !hospitalList) return;

  if (!navigator.geolocation) {
    status.innerHTML = "Geolocation is not supported in your browser.";
    hospitalList.innerHTML = "Nearby hospitals search not supported on this browser.";
    return;
  }

  if (
    window.location.protocol !== "https:" &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
  ) {
    status.innerHTML = "Location ke liye site ko HTTPS ya localhost par run karo.";
    hospitalList.innerHTML = "Hospitals dikhane ke liye secure mode required hai.";
    return;
  }

  status.innerHTML = "Fetching your current location...";
  hospitalList.innerHTML = "Searching nearby hospitals within 50 km...";

  navigator.geolocation.getCurrentPosition(
    showPosition,
    showError,
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    }
  );
}

function showPosition(position) {
  const lat = position.coords.latitude;
  const lng = position.coords.longitude;
  const accuracy = position.coords.accuracy;

  const status = document.getElementById("locationStatus");
  const hospitalList = document.getElementById("hospitalList");

  if (!status || !hospitalList) return;

  status.innerHTML = `
    <strong>Location fetched successfully ✅</strong><br>
    <strong>Latitude:</strong> ${lat.toFixed(6)}<br>
    <strong>Longitude:</strong> ${lng.toFixed(6)}<br>
    <strong>Accuracy:</strong> ${Math.round(accuracy)} meters<br>
    <strong>Search Radius:</strong> 50 km
  `;

  if (!map) {
    initLeafletMap();
  }

  const userLatLng = [lat, lng];

  if (userMarker) {
    map.removeLayer(userMarker);
  }

  userMarker = L.marker(userLatLng).addTo(map).bindPopup("You are here");

  if (searchCircle) {
    map.removeLayer(searchCircle);
  }

  searchCircle = L.circle(userLatLng, {
    radius: 50000,
    color: "#c62828",
    fillColor: "#c62828",
    fillOpacity: 0.12
  }).addTo(map);

  map.setView(userLatLng, accuracy > 1000 ? 11 : 13);

  fetchNearbyHospitals(lat, lng);
}

async function fetchNearbyHospitals(lat, lng) {
  const hospitalList = document.getElementById("hospitalList");
  if (!hospitalList) return;

  hospitalList.innerHTML = "Searching nearby hospitals within 50 km...";
  clearHospitalMarkers();

  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="hospital"](around:50000,${lat},${lng});
      way["amenity"="hospital"](around:50000,${lat},${lng});
      relation["amenity"="hospital"](around:50000,${lat},${lng});
    );
    out center tags;
  `;

  try {
    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=UTF-8"
      },
      body: query
    });

    if (!response.ok) {
      throw new Error("Hospital search request failed.");
    }

    const data = await response.json();

    let hospitals = (data.elements || []).map(item => {
      const itemLat = item.lat || (item.center && item.center.lat);
      const itemLng = item.lon || (item.center && item.center.lon);

      return {
        id: item.id,
        name: (item.tags && (item.tags.name || item.tags["name:en"])) || "Unnamed Hospital",
        address: buildHospitalAddress(item.tags || {}),
        lat: itemLat,
        lng: itemLng,
        emergency: item.tags && item.tags.emergency === "yes"
          ? "Emergency Available"
          : "Emergency info unavailable",
        phone: item.tags && (item.tags.phone || item.tags["contact:phone"])
          ? (item.tags.phone || item.tags["contact:phone"])
          : "Phone not available"
      };
    }).filter(item => item.lat && item.lng);

    hospitals = hospitals.map(h => ({
      ...h,
      distance: calculateDistanceKm(lat, lng, h.lat, h.lng)
    }));

    hospitals.sort((a, b) => a.distance - b.distance);

    renderHospitalResults(hospitals);
  } catch (error) {
    console.error("Nearby hospital fetch error:", error);
    hospitalList.innerHTML = "Nearby hospitals load nahi ho pa rahe. Thodi der baad try karo.";
  }
}

function buildHospitalAddress(tags) {
  const parts = [
    tags["addr:housename"],
    tags["addr:housenumber"],
    tags["addr:street"],
    tags["addr:suburb"],
    tags["addr:city"],
    tags["addr:state"]
  ].filter(Boolean);

  return parts.length ? parts.join(", ") : "Address not available";
}

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = degToRad(lat2 - lat1);
  const dLon = degToRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degToRad(lat1)) *
    Math.cos(degToRad(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function degToRad(deg) {
  return deg * (Math.PI / 180);
}

function renderHospitalResults(results) {
  const hospitalList = document.getElementById("hospitalList");
  if (!hospitalList || !map) return;

  hospitalList.innerHTML = "";

  if (!results.length) {
    hospitalList.innerHTML = "No hospitals found within 50 km.";
    return;
  }

  const bounds = [];

  if (userMarker) {
    bounds.push(userMarker.getLatLng());
  }

  results.slice(0, 30).forEach((hospital, index) => {
    const marker = L.marker([hospital.lat, hospital.lng]).addTo(map);

    marker.bindPopup(`
      <div style="max-width:220px;">
        <h3 style="margin:0 0 8px; font-size:16px; color:#c62828;">${hospital.name}</h3>
        <p style="margin:0 0 6px; font-size:13px;">${hospital.address}</p>
        <p style="margin:0 0 6px; font-size:13px;"><strong>${hospital.distance.toFixed(1)} km away</strong></p>
        <p style="margin:0; font-size:13px;">${hospital.emergency}</p>
      </div>
    `);

    hospitalMarkers.push(marker);
    bounds.push(marker.getLatLng());

    const item = document.createElement("div");
    item.className = "hospital-item";
    item.innerHTML = `
      <h4>${index + 1}. ${hospital.name}</h4>
      <p><strong>Address:</strong> ${hospital.address}</p>
      <p><strong>Distance:</strong> ${hospital.distance.toFixed(1)} km</p>
      <p><strong>Emergency:</strong> ${hospital.emergency}</p>
      <p><strong>Phone:</strong> ${hospital.phone}</p>
    `;

    item.addEventListener("click", function () {
      map.setView([hospital.lat, hospital.lng], 15);
      marker.openPopup();
    });

    hospitalList.appendChild(item);
  });

  if (bounds.length > 1) {
    map.fitBounds(bounds, { padding: [30, 30] });
  }
}

function showError(error) {
  const status = document.getElementById("locationStatus");
  const hospitalList = document.getElementById("hospitalList");

  if (!status) return;

  switch (error.code) {
    case error.PERMISSION_DENIED:
      status.innerHTML = "Location access denied. Browser me permission Allow karo.";
      break;
    case error.POSITION_UNAVAILABLE:
      status.innerHTML = "Location unavailable. GPS ya network issue ho sakta hai.";
      break;
    case error.TIMEOUT:
      status.innerHTML = "Location request timed out. Dobara try karo.";
      break;
    default:
      status.innerHTML = "Unable to fetch location.";
      break;
  }

  if (hospitalList) {
    hospitalList.innerHTML = "Hospital search could not be completed.";
  }
}

// =========================
// OLD CONNECTED HOSPITALS LIST
// =========================
function loadConnectedHospitals() {
  const list = document.getElementById("connectedHospitalsList");
  if (!list) return;

  db.collection("hospitals")
    .get()
    .then((snapshot) => {
      if (snapshot.empty) {
        list.innerHTML = `
          <div class="empty-connected">
            No connected hospitals yet. Click <strong>Add Hospital</strong> to register one.
          </div>
        `;
        return;
      }

      list.innerHTML = "";

      snapshot.forEach((doc) => {
        const data = doc.data();
        const name = getHospitalName(data);
        const rating = getHospitalRating(data);
        const city = data.city || "N/A";

        const card = document.createElement("div");
        card.className = "connected-card";
        card.innerHTML = `
          <h3>${name}</h3>
          <p><strong>City:</strong> ${city}</p>
          <span class="rating-badge">⭐ ${rating} / 5</span><br>
          <a class="view-btn" href="hospital-details.html?id=${doc.id}">View Details</a>
        `;
        list.appendChild(card);
      });
    })
    .catch((error) => {
      console.error("Error loading hospitals:", error);
      list.innerHTML = `
        <div class="empty-connected">
          Unable to load connected hospitals right now.
        </div>
      `;
    });
}

// =========================
// ENTER KEY SUPPORT + PAGE AUTO INIT
// =========================
document.addEventListener("DOMContentLoaded", function () {
  const questionInput = document.getElementById("question");
  if (questionInput) {
    questionInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        askAI();
      }
    });
  }

  const searchBlood = document.getElementById("searchBlood");
  if (searchBlood && !searchBlood.value) {
    searchBlood.value = "none";
  }

  if (document.getElementById("map")) {
    initLeafletMap();
  }

  if (document.getElementById("connectedHospitalsList")) {
    loadConnectedHospitals();
  }

  if (document.getElementById("cityFilter")) {
    loadHospitalCities();
  }

  if (document.getElementById("searchHospitalList")) {
    loadHospitalsByCity();
  }
});