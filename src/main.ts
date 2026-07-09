import * as THREE from "three";
import { SparkRenderer, SplatMesh } from "@sparkjsdev/spark";
import "./style.css";

type SplatPage = {
  description: string;
  path: string;
  title: string;
  url: string;
};

const splatPages: Record<string, SplatPage> = {
  train: {
    description: "Train capture",
    path: "/train",
    title: "Train",
    url: "/splats/train_1000.splat",
  },
  robotest: {
    description: "Robotest capture",
    path: "/robotest",
    title: "Robotest",
    url: "/splats/robotest.splat",
  },
};

function getCurrentPage() {
  const pageKey = window.location.pathname.replace(/^\/+/, "") || "train";

  return splatPages[pageKey] ?? splatPages.train;
}

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("Missing #app element");
}

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.01,
  1000
);

camera.position.set(0, 0, 0);
camera.lookAt(0, 0, -3);

const canvas = document.querySelector<HTMLCanvasElement>("#viewer");

const renderer = new THREE.WebGLRenderer({
  canvas: canvas ?? undefined,
  antialias: false,
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

if (!canvas) {
  app.appendChild(renderer.domElement);
}

const spark = new SparkRenderer({ renderer });
scene.add(spark);

const splatRoot = new THREE.Group();
scene.add(splatRoot);

let currentSplat: THREE.Object3D | null = null;
const currentPage = getCurrentPage();

const defaultSplatPosition = new THREE.Vector3(0, 0, -3);
const defaultSplatRotation = new THREE.Euler(0, 0, Math.PI);

function resetSplatView() {
  splatRoot.position.copy(defaultSplatPosition);
  splatRoot.rotation.copy(defaultSplatRotation);
}

resetSplatView();

function setStatus(message: string) {
  const status = document.querySelector("#status");

  if (status) {
    status.textContent = message;
  }
}

function setPageDetails(page: SplatPage) {
  document.title = `Lexindex Viewer - ${page.title}`;

  const title = document.querySelector("#splatTitle");
  const description = document.querySelector("#splatDescription");

  if (title) {
    title.textContent = page.title;
  }

  if (description) {
    description.textContent = page.description;
  }
}

async function createSplat(url: string): Promise<THREE.Object3D> {
  const splat = new SplatMesh({
    url,
  });

  return splat as unknown as THREE.Object3D;
}

async function loadSplatFromUrl(url: string) {
  setStatus(`Loading ${url}...`);

  if (currentSplat) {
    splatRoot.remove(currentSplat);
    currentSplat = null;
  }

  const splat = await createSplat(url);

  currentSplat = splat;
  splatRoot.add(currentSplat);

  setStatus(`Loaded ${url}`);
}

const fileInput = document.querySelector<HTMLInputElement>("#fileInput");

fileInput?.addEventListener("change", async () => {
  const file = fileInput.files?.[0];

  if (!file) return;

  const objectUrl = URL.createObjectURL(file);

  try {
    await loadSplatFromUrl(objectUrl);
    setStatus(`Loaded local file: ${file.name}`);
  } catch (error) {
    console.error(error);
    setStatus(`Failed to load ${file.name}`);
  }
});

const resetButton = document.querySelector<HTMLButtonElement>("#resetView");

resetButton?.addEventListener("click", () => {
  resetSplatView();

  camera.position.set(0, 0, 0);
  camera.lookAt(0, 0, -3);

  setStatus("View reset");
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
});

setPageDetails(currentPage);

loadSplatFromUrl(currentPage.url).catch(
  (error) => {
    console.error(error);
    setStatus("Failed to load default splat");
  }
);

renderer.setAnimationLoop(() => {
  splatRoot.rotation.y += 0.01;
  renderer.render(scene, camera);
});
