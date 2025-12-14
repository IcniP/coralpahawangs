// =============================================
// 0. MODULE IMPORTS
// =============================================
import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";

// =============================================
// 1. GLOBAL VARIABLES & CONFIG
// =============================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b1517);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true });
const loader = new GLTFLoader();
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let controls;
let object;
let currentModel = null;
let interactionPlane;
let container3D;

// State & Data
const modelStates = ["normal", "bleached", "dead"];
let polipScene, polipCamera, polipRenderer, polipLoader, polipObject;
let currentModelStateIndex = 0;
let isDragging = false;
let isModelLoading = false;
let objToRender = null;
let currentCoralIndex = 0;
let currentCoralTypeIndex = 0;
let isInsideCoralArea = false;
let isScrolling = false;
let modelLoadTimeout = null;
let modelChangeTimer = null;

const stateInfoData = {
  normal: {
    title: "Healthy Coral",
    desc: "Karang sehat berwarna cerah seperti cokelat, hijau, atau ungu dengan permukaan halus dan polip aktif. Hubungan simbiotik dengan alga zooxanthellae berjalan baik, menandakan ekosistem laut yang stabil dan produktif."
  },
  bleached: {
    title: "Bleached Coral",
    desc: "Karang memutih tampak pucat atau putih karena kehilangan alga zooxanthellae. Jaringannya masih ada, tetapi polip terlihat lemah dan kurang aktif akibat stres lingkungan seperti suhu tinggi."
  },
  dead: {
    title: "Dead Coral",
    desc: "Karang mati berwarna abu-abu atau ditumbuhi alga, dengan struktur keras dari kalsium karbonat yang tersisa. Tidak ada jaringan hidup, menandakan ekosistem terumbu karang yang rusak."
  }
};

const coralData = [
  {
    id: "Branching",
    name: "BRANCHING CORALS",
    model: "BranchingCoral",
    img: "Website/img/AcroporaBranching.webp",
    desc: `Karang ini tumbuh melekat rapat pada permukaan batuan atau substrat, sehingga tampak seperti lapisan keras yang menutupi area tertentu. Permukaannya dipenuhi koralit yang dapat dilihat jelas. Contoh: Acropora palifera.`,
    desc2: `<p>Karang jenis ini memiliki bentuk menyerupai cabang pohon atau tanduk rusa dengan struktur bercabang-cabang yang padat. Cabang utamanya memiliki axial corallite yang berfungsi sebagai pusat pertumbuhan. Pertumbuhan karang ini tergolong cepat dibanding jenis lainnya, sehingga sering menjadi indikator awal pemulihan ekosistem terumbu karang yang sehat.</p>
            <p>Acropora branching banyak ditemukan di perairan dangkal yang memiliki intensitas cahaya tinggi dan arus kuat. Selain berperan penting dalam membentuk kerangka terumbu, bentuk percabangannya juga menyediakan habitat bagi berbagai ikan kecil dan invertebrata laut. Contohnya adalah Acropora formosa.</p>`,
    otherName: "Acropora Formosa",
  },
  {
    id: "Massive",
    name: "MASSIVE CORALS",
    model: "coralMassive",
    img: "Website/img/CoralMassive.webp",
    desc: "bentuknya bongkahan seperti batu. Semakin besar ukuran karang ini biasanya menandakan ekosistem karang yang cukup baik dan tidak terganggu, karena karang ini merupakan salah satu yang lama pertumbuhannya.",
    desc2: `<p>Karang massive memiliki bentuk bulat besar atau bongkahan padat menyerupai batu, dengan pertumbuhan yang sangat lambat namun kuat. Karena ketahanannya, karang ini sering bertahan dalam kondisi lingkungan yang ekstrem, seperti perubahan suhu atau gelombang kuat.</p>
            <p>Selain itu karang massive dapat digunakan untuk mempelajari sejarah iklim laut karena pertumbuhannya yang berlapis-lapis menyimpan rekam jejak kimiawi lingkungan masa lalu. Contohnya adalah Leptoria phrygia. </p>`,
    otherName: "Leptoria Phrygia",
  },
  {
    id: "Foliose",
    name: "FOLIOSE CORALS",
    model: "Coral_Daun",
    img: "Website/img/CoralFoliose.webp",
    desc: "Karang ini berbentuk seperti serutan kayu/lembaran. Contoh karang ini yaitu Montipora sp & tubinaria sp.",
    desc2: `<p>Karang foliose berbentuk seperti lembaran atau daun yang saling bertumpuk menyerupai mangkuk atau kelopak bunga. Bentuk ini memungkinkan permukaan yang luas untuk menangkap cahaya matahari, mendukung simbiosis dengan alga zooxanthellae di dalamnya.<\p>
            <p>Jenis ini umumnya tumbuh di daerah dengan cahaya sedang hingga kuat dan arus cukup tenang. Coral foliose membantu meningkatkan kompleksitas habitat dan menyediakan tempat berlindung bagi ikan kecil dan biota lainnya.<\p>`,
    otherName: "Montipora Sp.",
  },
  {
    id: "Tabular",
    name: "TABULAR CORALS",
    model: "CoralTabular",
    img: "Website/img/AcroporaTabulate.webp",
    desc: "Karang ini berbentuk seperti meja/table. Sangat mudah untuk diidentifikasi. Contoh karang ini yaitu Acropora hyacinthus.",
    desc2: `<p>Karang tabulate berbentuk datar menyerupai meja besar dengan cabang-cabang pendek yang saling terhubung. Struktur ini menciptakan permukaan yang lebar, ideal untuk menangkap cahaya di perairan dangkal.<\p>
            <p>Pertumbuhan karang ini cenderung menyebar ke samping, sehingga mampu memperluas area tutupan karang dengan cepat. Bentuk datarnya juga menjadi tempat berlindung bagi berbagai spesies ikan karang kecil. <\p>`,
    otherName: "Acropora Hyacinthus",
  },
  {
    id: "Encrusting",
    name: "ENCRUSTING CORALS",
    model: "coralencrust",
    img: "Website/img/AcroporaEncrusting.webp",
    desc: "Karang ini tumbuh melekat rapat pada permukaan batuan atau substrat, sehingga tampak seperti lapisan keras yang menutupi area tertentu. Permukaannya dipenuhi koralit yang dapat dilihat jelas. Contoh: Acropora palifera.",
    desc2: `<p>Jenis karang ini tumbuh menempel dan melebar di permukaan substrat seperti batu atau dasar karang lain. Pertumbuhannya mengikuti kontur permukaan tempat ia melekat, membentuk lapisan keras dengan banyak koralit di permukaannya. Karakter ini membuatnya tahan terhadap arus kuat dan sedimen tinggi.<\p>
            <p>Karang encrusting berperan penting sebagai “perekat alami” di ekosistem terumbu karena membantu memperkuat struktur dasar karang. Jenis ini juga dapat menutupi area yang rusak dan mencegah erosi substrat. Contohnya adalah Acropora palifera.<\p>`,
    otherName: "Acropora Palifera",
  },
  {
    id: "Mushroom",
    name: "MUSHROOM CORALS",
    model: "CoralMushroom",
    img: "Website/img/CoralMushroom.webp",
    desc: "Karang ini berbentuk sperti jamur. Diantara karang-karang lain, hanya karang dengan bentuk ini yang merupakan karang soliter. ",
    desc2: `<p>Coral mushroom memiliki bentuk menyerupai jamur dengan permukaan bulat dan agak cekung di bagian tengah. Tidak seperti kebanyakan karang lain, jenis ini biasanya hidup soliter (tidak berkoloni) dan dapat bergerak sedikit di atas pasir.<\p>
            <p>Karang ini beradaptasi baik di dasar berpasir atau berlumpur dan dapat bertahan pada kondisi dengan arus lemah. Struktur uniknya menjadikannya elemen penting dalam keanekaragaman bentuk ekosistem terumbu karang.<\p>`,
    otherName: "Fungia Sp.",
  },
];

// DOM Elements
const coralScrollContainer = document.querySelector(".coral-type-scroll-container");
const coralTitle = document.getElementById("coralTitle");
const coralDescription = document.getElementById("coralDescription");
const btnExploreHome = document.getElementById("btnExploreHome");

const coralNavHorizontal = document.getElementById("coral-nav-horizontal");
const mainCoralTitle = document.getElementById("mainCoralTitle");
const mainCoralImage = document.getElementById("mainCoralImage");
const mainCoralDescription = document.getElementById("mainCoralDescription");
const mainPhotoElement = document.getElementById("mainPhoto");
const photoTitleElement = document.getElementById("photoTitle");
const photoDescElement = document.getElementById("photoDesc");

const sections = document.querySelectorAll(".section-full-height");
const navLinks = document.querySelectorAll(".nav-link");
const navContainer = document.querySelector(".nav-links-container");

// =============================================
// 2. THREE.JS & 3D MODEL FUNCTIONS
// =============================================

function initThree() {
  container3D = document.getElementById("container3D");
  if (!container3D) return;

  renderer.setSize(container3D.clientWidth, container3D.clientHeight);
  camera.aspect = container3D.clientWidth / container3D.clientHeight;
  camera.updateProjectionMatrix();
  container3D.appendChild(renderer.domElement);

  const topLight = new THREE.DirectionalLight(0xffffff, 1);
  topLight.position.set(500, 500, 500);
  topLight.castShadow = true;
  scene.add(topLight);

  const ambientLight = new THREE.AmbientLight(0x333333, 5);
  scene.add(ambientLight);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enableRotate = true;
  controls.enabled = false;

  controls.addEventListener("start", function () {
    isDragging = true;
    if (modelChangeTimer) {
      clearTimeout(modelChangeTimer);
      modelChangeTimer = null;
    }
  });

  controls.addEventListener("end", function () {
    isDragging = false;
    if (document.body.dataset.section === "home") {
      if (modelChangeTimer) clearTimeout(modelChangeTimer);
      
      modelChangeTimer = setTimeout(() => {
        if (document.body.dataset.section !== "home" || isModelLoading || isDragging) {
          modelChangeTimer = null;
          return;
        }
        currentModelStateIndex = (currentModelStateIndex + 1) % modelStates.length;
        const newState = modelStates[currentModelStateIndex];
        const activeItem = coralData[currentCoralIndex];
        
        if (activeItem) {
          loadNewModel(activeItem.model, newState);
          updateStateText(newState);
        }
        modelChangeTimer = null;
      }, 3000); 
    }
  });
}

function loadNewModel(modelName, modelState = "normal") {
  if (isModelLoading) return;
  isModelLoading = true;

  if (currentModel) {
    scene.remove(currentModel);
    currentModel = null;
    if (interactionPlane) {
      scene.remove(interactionPlane);
      interactionPlane = null;
    }
  }

  if (!modelName) {
    isModelLoading = false;
    return;
  }

  objToRender = modelName;
  const modelPath = modelState === "normal" 
    ? `Website/3d/${objToRender}/Coral.gltf` 
    : `Website/3d/${modelState}/${objToRender}/Coral.gltf`;

  loader.load(
    modelPath, 
    function (gltf) {
      object = gltf.scene;
      currentModel = object;

      const modelSaturationFactor = {
        BranchingCoral: 5.4,
        coralMassive: 1.2,
        Coral_Daun: 1.5,
        CoralTabular: 1.0,
        coralencrust: 0.8,
        CoralMushroom: 1.8,
      };
      const satFactor = modelSaturationFactor[modelName] || 1.0;

      object.traverse((child) => {
        if (child.isMesh && child.material && child.material.color) {
          const hsl = {};
          child.material.color.getHSL(hsl);
          if (modelState === "normal") {
            hsl.s = Math.max(0, Math.min(hsl.s * satFactor, 1.0));
          }
          child.material.color.setHSL(hsl.h, hsl.s, hsl.l);
          child.material.needsUpdate = true;
        }
      });

      const cameraAndScaleAdjustments = {
        BranchingCoral: { scale: 1.6, camZ: 5.5, camY: 1.8 },
        coralMassive: { scale: 1.3, camZ: 2, camY: 0.0 },
        Coral_Daun: { scale: 1.8, camZ: 7.5, camY: 0.0 },
        CoralTabular: { scale: 1.5, camZ: 2.2, camY: 0.7 },
        coralencrust: { scale: 1.4, camZ: 1.5, camY: 0.0 },
        CoralMushroom: { scale: 2.0, camZ: 6.5, camY: 0.0 },
      };
      const adj = cameraAndScaleAdjustments[modelName] || { scale: 1.5, camZ: 3.5, camY: 0.0 };

      object.scale.set(adj.scale, adj.scale, adj.scale);

      const box = new THREE.Box3().setFromObject(object);
      const center = box.getCenter(new THREE.Vector3());
      object.position.sub(center);
      object.position.y = 0; 
      scene.add(object);

      const size = box.getSize(new THREE.Vector3());
      const planeSize = Math.max(size.x, size.y) * 1.2;
      const interactionPlaneGeometry = new THREE.PlaneGeometry(planeSize, planeSize);
      const interactionPlaneMaterial = new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide });
      
      interactionPlane = new THREE.Mesh(interactionPlaneGeometry, interactionPlaneMaterial);
      interactionPlane.position.copy(object.position);
      scene.add(interactionPlane);

      camera.position.set(0, adj.camY, adj.camZ);
      camera.lookAt(0, adj.camY, 0);
      controls.target.set(0, adj.camY, 0);
      controls.update();

      isModelLoading = false;
    },
    undefined,
    function (error) {
      console.error(`Error loading ${modelName} (${modelState}):`, error);
      isModelLoading = false;
    }
  );
}

function initPolipScene() {
  const container = document.getElementById("polipContainer");
  if (!container) return;

  polipScene = new THREE.Scene();
  polipCamera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 100);

  polipRenderer = new THREE.WebGLRenderer({ alpha: true });
  polipRenderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(polipRenderer.domElement);

  const topLight = new THREE.DirectionalLight(0xffffff, 1.5);
  topLight.position.set(50, 50, 50);
  polipScene.add(topLight);

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
  polipScene.add(ambientLight);

  polipLoader = new GLTFLoader();
  loadPolipModel();
}

function loadPolipModel() {
  if (!polipLoader) return;
  polipLoader.load(
    `Website/3d/Filler/polip/Polip.gltf`,
    function (gltf) {
      polipObject = gltf.scene;
      const polipScale = 3.5;
      polipObject.scale.set(polipScale, polipScale, polipScale);

      const box = new THREE.Box3().setFromObject(polipObject);
      const center = box.getCenter(new THREE.Vector3());
      polipObject.position.sub(center);

      polipScene.add(polipObject);
      polipCamera.position.set(0, 0, 5);
      polipCamera.lookAt(0, 0, 0);
    },
    undefined,
    function (error) { console.error("Error loading polip:", error); }
  );
}

// =============================================
// 3. HOME SECTION (HERO) LOGIC
// =============================================

function renderCoralItems(setActive = false) {
  if (!coralScrollContainer) return;

  coralScrollContainer.innerHTML = "";
  const totalData = coralData.length;

  for (let i = -1; i <= 1; i++) {
    let dataIndex = (currentCoralIndex + i + totalData) % totalData;
    const item = coralData[dataIndex];

    const itemDiv = document.createElement("div");
    itemDiv.classList.add("coral-scroll-item");
    itemDiv.setAttribute("data-model", item.model);
    itemDiv.setAttribute("data-index", dataIndex);

    const img = document.createElement("img");
    img.src = item.img;
    img.alt = item.name;
    itemDiv.appendChild(img);

    if (i === 0) itemDiv.classList.add("active");
    coralScrollContainer.appendChild(itemDiv);
  }

  const activeItem = coralData[currentCoralIndex];
  if(coralTitle) coralTitle.textContent = activeItem.name;
  if(coralDescription) coralDescription.textContent = `${activeItem.desc}`;

  if (setActive) {
    clearTimeout(modelLoadTimeout);
    modelLoadTimeout = setTimeout(() => {
      const activeModelName = activeItem.model;
      const activeState = modelStates[currentModelStateIndex]; 
      loadNewModel(activeModelName, activeState); 
      updateStateText(activeState);
    }, 400);
  }
}

function disablePageScroll() { document.body.style.overflow = "hidden"; }
function enablePageScroll() { document.body.style.overflow = ""; }

function isCursorInsideCoral(x, y) {
  if (!coralScrollContainer) return false;
  const rect = coralScrollContainer.getBoundingClientRect();
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

window.addEventListener("mousemove", (e) => {
  if(document.body.dataset.section === "home") {
      const inside = isCursorInsideCoral(e.clientX, e.clientY);
      if (inside && !isInsideCoralArea) {
        disablePageScroll();
        isInsideCoralArea = true;
      } else if (!inside && isInsideCoralArea) {
        enablePageScroll();
        isInsideCoralArea = false;
      }
  } else {
    enablePageScroll();
  }
});

if(coralScrollContainer) {
    coralScrollContainer.addEventListener("touchstart", () => {
        if (document.body.dataset.section === "home") disablePageScroll();
    }, { passive: false });

    coralScrollContainer.addEventListener("touchend", () => {
        if (document.body.dataset.section === "home") enablePageScroll();
    }, { passive: false });
}

function initVerticalScrollLogic() {
  if(!coralScrollContainer) return;

  let isPointerDown = false;
  let startYPos = 0;
  let startScrollTop = 0;
  let moved = false;
  let pointerId = null;
  let animating = false;

  function easeInOut(t) { return 0.5 - Math.cos(t * Math.PI) / 2; }

  function smoothScrollToVertical(target, duration = 420) {
    if (animating) return;
    animating = true;
    const start = coralScrollContainer.scrollTop;
    const change = target - start;
    const startTime = performance.now();
    function step(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      coralScrollContainer.scrollTop = Math.round(start + change * easeInOut(progress));
      if (progress < 1) requestAnimationFrame(step);
      else animating = false;
    }
    requestAnimationFrame(step);
  }

  function getCenterTargetForItem(item) {
    return (item.offsetTop - (coralScrollContainer.clientHeight - item.clientHeight) / 2);
  }

  function snapToClosestItem() {
    const rect = coralScrollContainer.getBoundingClientRect();
    const centerY = rect.top + rect.height / 2;
    const items = Array.from(coralScrollContainer.querySelectorAll(".coral-scroll-item"));
    if (!items.length) return;
    let closest = null, minDist = Infinity;
    items.forEach((it) => {
      const itRect = it.getBoundingClientRect();
      const itCenter = itRect.top + itRect.height / 2;
      const dist = Math.abs(centerY - itCenter);
      if (dist < minDist) { minDist = dist; closest = it; }
    });
    if (closest) {
      const target = getCenterTargetForItem(closest);
      smoothScrollToVertical(target, 420);
      const idx = parseInt(closest.dataset.index);
      setTimeout(() => {
        if (currentCoralIndex !== idx) { currentModelStateIndex = 0; }
        currentCoralIndex = idx;
        currentCoralTypeIndex = idx;
        renderCoralItems(true);
      }, 440);
    }
  }

  coralScrollContainer.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    isPointerDown = true;
    moved = false;
    pointerId = e.pointerId;
    startYPos = e.clientY;
    startScrollTop = coralScrollContainer.scrollTop;
    coralScrollContainer.setPointerCapture(pointerId);
    coralScrollContainer.style.cursor = "grabbing";
    animating = false;
  });

  coralScrollContainer.addEventListener("pointermove", (e) => {
    if (!isPointerDown) return;
    const diff = e.clientY - startYPos;
    if (Math.abs(diff) > 8) moved = true;
    if (moved) {
      e.preventDefault();
      coralScrollContainer.scrollTop = startScrollTop - diff;
    }
  });

  coralScrollContainer.addEventListener("pointerup", (e) => {
    if (!isPointerDown) return;
    isPointerDown = false;
    coralScrollContainer.style.cursor = "grab";
    coralScrollContainer.releasePointerCapture(pointerId);
    if (!moved) {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const item = el && el.closest(".coral-scroll-item");
      if (item) {
        const index = parseInt(item.dataset.index);
        if (index !== currentCoralIndex) { 
           // Snap logic inline
           const targetItem = coralScrollContainer.querySelector(`.coral-scroll-item[data-index="${index}"]`);
           if (targetItem) {
             const target = getCenterTargetForItem(targetItem);
             smoothScrollToVertical(target, 420);
             setTimeout(() => {
               if (currentCoralIndex !== index) currentModelStateIndex = 0;
               currentCoralIndex = index;
               currentCoralTypeIndex = index;
               renderCoralItems(true);
             }, 440);
           }
        }
      }
      return;
    }
    snapToClosestItem();
    e.preventDefault();
    e.stopPropagation();
  });

  coralScrollContainer.addEventListener("pointercancel", () => {
    isPointerDown = false;
    coralScrollContainer.style.cursor = "grab";
  });

  coralScrollContainer.addEventListener("wheel", (e) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    e.preventDefault();
    const step = e.deltaY > 0 ? 120 : -120;
    const rawTarget = coralScrollContainer.scrollTop + step;
    const target = Math.max(0, Math.min(rawTarget, coralScrollContainer.scrollHeight - coralScrollContainer.clientHeight));
    smoothScrollToVertical(target, 280);
    clearTimeout(coralScrollContainer._wheelSnapTimeout);
    coralScrollContainer._wheelSnapTimeout = setTimeout(() => { snapToClosestItem(); }, 320);
  }, { passive: false });
}

// =============================================
// 4. CORAL TYPE SECTION LOGIC
// =============================================

function updateMainCoralContent(index) {
  if(!mainCoralTitle) return;

  const item = coralData[index];
  mainCoralTitle.textContent = item.name;
  mainCoralImage.src = item.img;
  mainCoralImage.alt = item.name;
  mainCoralDescription.innerHTML = item.desc2;

  if (mainPhotoElement) {
    mainPhotoElement.src = `Website/Fjs/${item.model}.webp`;
    mainPhotoElement.alt = item.name;
    photoTitleElement.textContent = item.otherName;
    photoDescElement.textContent = ""; 
  }

  document.querySelectorAll(".coral-type-card").forEach((card) => {
    card.classList.remove("active");
    if (parseInt(card.dataset.index) === index) card.classList.add("active");
  });
  
  currentCoralTypeIndex = index;

  // Auto Scroll Active Card into View
  if (coralNavHorizontal) {
    const card = coralNavHorizontal.querySelector(`.coral-type-card[data-index="${index}"]`);
    if (card) {
      card.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }
}

function renderCoralTypeNavigation() {
  if(!coralNavHorizontal) return;

  coralNavHorizontal.innerHTML = "";
  coralData.forEach((item, index) => {
    const card = document.createElement("div");
    card.classList.add("coral-type-card");
    card.setAttribute("data-index", index);
    card.innerHTML = `<img src="${item.img}" alt="${item.name}" class="card-img">
                      <h4 class="card-title">${item.id}</h4>`;
    card.addEventListener("click", () => {
      updateMainCoralContent(index);
    });
    coralNavHorizontal.appendChild(card);
  });
  updateMainCoralContent(currentCoralTypeIndex);
}

function initHorizontalScrollLogic() {
  if(!coralNavHorizontal) return;

  let isDown = false;
  let startX, scrollLeft, moved = false;
  let pointerId = null;
  let scrollTarget = 0;
  let animating = false;

  function smoothScrollTo(target) {
    const start = coralNavHorizontal.scrollLeft;
    const change = target - start;
    const duration = 400; 
    const startTime = performance.now();
    function animateScroll(time) {
      const progress = Math.min((time - startTime) / duration, 1);
      const ease = 0.5 - Math.cos(progress * Math.PI) / 2; 
      coralNavHorizontal.scrollLeft = start + change * ease;
      if (progress < 1) { requestAnimationFrame(animateScroll); } 
      else { animating = false; }
    }
    if (!animating) { animating = true; requestAnimationFrame(animateScroll); }
  }

  coralNavHorizontal.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    isDown = true;
    moved = false;
    pointerId = e.pointerId;
    coralNavHorizontal.setPointerCapture(pointerId);
    startX = e.clientX;
    scrollLeft = coralNavHorizontal.scrollLeft;
    coralNavHorizontal.style.cursor = "grabbing";
  });

  coralNavHorizontal.addEventListener("pointermove", (e) => {
    if (!isDown) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 8) moved = true;
    if (moved) { e.preventDefault(); coralNavHorizontal.scrollLeft = scrollLeft - dx; }
  });

  coralNavHorizontal.addEventListener("pointerup", (e) => {
    if (!isDown) return;
    isDown = false;
    coralNavHorizontal.releasePointerCapture(pointerId);
    coralNavHorizontal.style.cursor = "grab";
    if (!moved) {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const card = el && el.closest(".coral-type-card");
      if (card) { card.click(); }
      return;
    }
    e.preventDefault();
    e.stopPropagation();
  });

  coralNavHorizontal.addEventListener("pointercancel", () => {
    isDown = false;
    coralNavHorizontal.style.cursor = "grab";
  });

  coralNavHorizontal.addEventListener("wheel", (e) => {
    if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
    e.preventDefault();
    const step = e.deltaY > 0 ? 250 : -250;
    scrollTarget = coralNavHorizontal.scrollLeft + step;
    smoothScrollTo(scrollTarget);
  }, { passive: false });
}

function updateStateText(state) {
  const titleEl = document.getElementById("stateTitle");
  const descEl = document.getElementById("stateDesc");
  const infoContainer = document.querySelector(".coral-state-info");

  if (stateInfoData[state] && titleEl && descEl) {
    infoContainer.style.opacity = 0; 
    setTimeout(() => {
      titleEl.textContent = stateInfoData[state].title;
      descEl.textContent = stateInfoData[state].desc;
      
      if (state === "normal") titleEl.style.color = "#ffffff";
      if (state === "bleached") titleEl.style.color = "#ffdddd";
      if (state === "dead") titleEl.style.color = "#888888";

      infoContainer.style.opacity = 1; 
    }, 500);
  }
}

// =============================================
// 5. NAVIGATION & SCROLL-SPY LOGIC
// =============================================
const sectionColors = {
  home: "#03132A",
  "coral-type": "#550b15",
  gallery: "#150b55",
};

function updateSlider(activeLink) {
  if (!activeLink || !navContainer) return;
  requestAnimationFrame(() => {
    const containerRect = navContainer.getBoundingClientRect();
    const linkRect = activeLink.getBoundingClientRect();
    const relativeLeft = linkRect.left - containerRect.left;
    const width = linkRect.width;

    navContainer.style.setProperty("--slider-width", `${width + 10}px`);
    navContainer.style.setProperty("--slider-translate", `${relativeLeft - 5}px`);
  });
}

function updateBackground(activeSectionId) {
  const color = sectionColors[activeSectionId];
  if (color) {
    document.body.style.backgroundColor = color;
    document.body.dataset.section = activeSectionId;
    if (activeSectionId === "home") {
      scene.background = new THREE.Color(color);
      const activeItem = coralData[currentCoralIndex];
      const activeState = modelStates[currentModelStateIndex]; 
      loadNewModel(activeItem.model, activeState); 
    } else {
      scene.background = null;
      loadNewModel(null); 
      currentCoralTypeIndex = currentCoralIndex;
    }
  }
}

function setActiveLink(sectionId) {
  navLinks.forEach((link) => {
    link.classList.remove("active");
    const href = link.getAttribute("href");
    if (href.startsWith("#") && href.substring(1) === sectionId) {
      link.classList.add("active");
      updateSlider(link);
      updateBackground(sectionId);
    } 
    else if (!href.startsWith("#")) {
      const path = window.location.pathname;
      if (path.endsWith(href)) {
        link.classList.add("active");
        updateSlider(link);
      }
    }
  });
}

const observerCallback = (entries) => {
  if (isScrolling) return; 
  entries.forEach((entry) => {
    if (entry.isIntersecting) setActiveLink(entry.target.id);
  });
};

const observer = new IntersectionObserver(observerCallback, {
  root: null,
  rootMargin: "-20% 0px -80% 0px", 
  threshold: 0,
});

function initializePageLogic() {
  const currentPath = window.location.pathname;
  const isMap = currentPath.includes("map.html");
  const is360 = currentPath.includes("360.html");
  const isStaticPage = isMap || is360;

  if (isStaticPage) {
    navLinks.forEach(l => l.classList.remove("active"));
    if (isMap) {
      const link = document.querySelector('a[href="map.html"]');
      link.classList.add("active");
      updateSlider(link);
    }
    if (is360) {
      const link = document.querySelector('a[href="360.html"]');
      link.classList.add("active");
      updateSlider(link);
    }
    setupClickListeners(); 
    return;
  }

  sections.forEach((section) => { observer.observe(section); });
  
  const activeLink = document.querySelector(".nav-link.active");
  if (activeLink) {
      setTimeout(() => { updateSlider(activeLink); }, 100);
  }

  setupClickListeners();
  renderCoralTypeNavigation();
}

function setupClickListeners() {
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");
      if (!href.startsWith("#")) return; 

      e.preventDefault();
      
      if (modelChangeTimer) {
        clearTimeout(modelChangeTimer);
        modelChangeTimer = null;
      }
      
      const targetId = href.substring(1);
      const targetSection = document.getElementById(targetId);
      if (!targetSection) return;

      setActiveLink(targetId);
      updateBackground(targetId);
      isScrolling = true; 

      targetSection.scrollIntoView({ behavior: "smooth", block: "start" });

      const SCROLL_LOCK_MS = 480;
      setTimeout(() => {
        window.scrollTo({ top: targetSection.offsetTop, left: 0, behavior: "auto" });
        if (targetId === "coral-type") {
          const targetCard = document.querySelector(`.coral-type-card[data-index="${currentCoralTypeIndex}"]`);
          if (targetCard) {
            targetCard.scrollIntoView({ behavior: "auto", inline: "center", block: "nearest" });
          }
        }
        setTimeout(() => { isScrolling = false; }, 40);
      }, SCROLL_LOCK_MS);
    });
  });
}

// =============================================
// 6. GALLERY MODAL LOGIC
// =============================================
const galleryGrid = document.querySelector(".gallery-grid");
const modal = document.getElementById("galleryModal");
const modalImg = document.getElementById("modalImage");
const modalClose = document.querySelector(".modal-close");

function closeModal() {
  if(modal) modal.classList.remove("show");
  enablePageScroll(); 
}

if(galleryGrid) {
    galleryGrid.addEventListener("click", function (e) {
      const clickedItem = e.target.closest(".gallery-item");
      if (clickedItem) {
        const img = clickedItem.querySelector("img");
        if (img) {
          modalImg.src = img.src;
          modal.classList.add("show");
          disablePageScroll(); 
        }
      }
    });
}

if(modalClose) modalClose.addEventListener("click", closeModal);
if(modal) {
    modal.addEventListener("click", function (e) {
      if (e.target === modal) { closeModal(); }
    });
}

// =============================================
// 7. MAIN ANIMATION LOOP & EVENT LISTENERS
// =============================================

function animate() {
  requestAnimationFrame(animate);
  controls.update();

  if (object && !isDragging) object.rotation.y += 0.001;
  if (interactionPlane) interactionPlane.lookAt(camera.position);
  if (renderer && scene && camera) renderer.render(scene, camera);

  if (polipObject) polipObject.rotation.y += 0.005; 
  if (polipRenderer && polipScene && polipCamera) polipRenderer.render(polipScene, polipCamera); 
}

window.addEventListener("resize", function () {
  if (container3D) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  const polipContainer = document.getElementById("polipContainer");
  if (polipRenderer && polipCamera && polipContainer) {
    polipCamera.aspect = polipContainer.clientWidth / polipContainer.clientHeight;
    polipCamera.updateProjectionMatrix();
    polipRenderer.setSize(polipContainer.clientWidth, polipContainer.clientHeight);
  }

  const activeLink = document.querySelector(".nav-link.active");
  if (activeLink) updateSlider(activeLink);
});

if(renderer && renderer.domElement) {
    renderer.domElement.addEventListener("mousemove", onMouseMove);
}

function onMouseMove(event) {
  if (isDragging) return;
  if (document.body.dataset.section !== "home") {
    controls.enabled = false;
    document.body.style.cursor = "default";
    return;
  }

  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  if (interactionPlane) {
    const intersects = raycaster.intersectObject(interactionPlane, false);
    const coralInfoEl = document.querySelector('.coral-state-info'); 

    if (intersects.length > 0) {
      controls.enabled = true; 
      document.body.style.cursor = "grab";
      if (coralInfoEl) coralInfoEl.classList.add('show');
    } else {
      controls.enabled = false; 
      document.body.style.cursor = "default";
      if (coralInfoEl) coralInfoEl.classList.remove('show');
    }
  }
}

if(btnExploreHome) {
    btnExploreHome.addEventListener("click", (e) => {
      e.preventDefault();
      currentCoralTypeIndex = currentCoralIndex; 
      updateMainCoralContent(currentCoralTypeIndex);

      const coralTypeLink = document.querySelector('a[href="#coral-type"]');
      if (coralTypeLink) { coralTypeLink.click(); }
    });
}

const polipContainerEl = document.getElementById('polipContainer');
const polipInfoEl = document.querySelector('.polip-info-overlay');

if (polipContainerEl && polipInfoEl) {
    polipContainerEl.addEventListener('mouseenter', () => polipInfoEl.classList.add('show'));
    polipContainerEl.addEventListener('mouseleave', () => polipInfoEl.classList.remove('show'));
}

// =============================================
// 8. INITIALIZATION (STARTUP)
// =============================================
window.addEventListener("load", () => {
  document.documentElement.style.scrollBehavior = "auto"; 
  isScrolling = true;

  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }

  function forceScrollTop(attempts = 10) {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    if (attempts > 0) requestAnimationFrame(() => forceScrollTop(attempts - 1));
  }
  forceScrollTop();

  setTimeout(() => {
    initThree();
    initPolipScene();
    initializePageLogic();
    
    // Init Scroll Logics
    initVerticalScrollLogic();
    initHorizontalScrollLogic();
    
    if(coralScrollContainer) {
        currentCoralIndex = 0;
        renderCoralItems(true);
        currentCoralTypeIndex = currentCoralIndex;
        updateMainCoralContent(currentCoralTypeIndex); 
        updateStateText("normal");
    }

    setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      document.documentElement.style.scrollBehavior = "smooth";
      isScrolling = false;
    }, 300);
  }, 100);
});

animate();