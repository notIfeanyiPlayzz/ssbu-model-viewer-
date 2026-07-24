import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SSBUModFiles } from './types';
import { parseSmashMesh } from './meshParser';
import { parseSmashSkeleton } from './skeletonParser';

// Global Engine Variables
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;

const container = document.getElementById('canvas-container')!;
const folderInput = document.getElementById('folder-input') as HTMLInputElement;
const fileListUI = document.getElementById('file-list')!;
const activeModContext: SSBUModFiles = { textures: [] };

// Track files inside a local temporary flat array map cache for fast lookup selection
let loadedFileMemoryCache: File[] = [];

// Initialize immediately
initEngine();

function initEngine(): void {
  try {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);

    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 6, 12);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 2, 0);
    controls.minDistance = 2;
    controls.maxDistance = 50;

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const light = new THREE.DirectionalLight(0xffffff, 0.8);
    light.position.set(5, 10, 7);
    scene.add(light);

    const visualGrid = new THREE.GridHelper(20, 20, 0x0a84ff, 0x444446);
    scene.add(visualGrid);

    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshStandardMaterial({ color: 0x0a84ff, roughness: 0.4 });
    const meshPlaceholder = new THREE.Mesh(geometry, material);
    meshPlaceholder.position.y = 1;
    meshPlaceholder.name = "placeholder_cube";
    scene.add(meshPlaceholder);

    window.addEventListener('resize', handleResize);
    renderLoop();
  } catch (err) {
    console.error("Critical failure during WebGL initialization context:", err);
  }
}

function renderLoop(): void {
  requestAnimationFrame(renderLoop);
  if (controls) controls.update();
  
  if (scene) {
    const targetCube = scene.getObjectByName("placeholder_cube");
    if (targetCube) targetCube.rotation.y += 0.003;
    if (renderer && camera) renderer.render(scene, camera);
  }
}

function handleResize(): void {
  if (!camera || !renderer || !container) return;
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}

function evaluateAndStoreFile(file: File): void {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  
  if (['numdlb', 'numshb', 'nusktb', 'numatb', 'nutexb'].includes(fileExtension || '')) {
    loadedFileMemoryCache.push(file);
    const assignedIndex = loadedFileMemoryCache.length - 1;
    appendFileToUI(file.name, assignedIndex);
  }

  switch (fileExtension) {
    case 'numdlb': activeModContext.model = file; break;
    case 'numshb': activeModContext.mesh = file; break;
    case 'nusktb': activeModContext.skeleton = file; break;
    case 'numatb': activeModContext.material = file; break;
    case 'nutexb': activeModContext.textures.push(file); break;
  }
}

function appendFileToUI(fileName: string, cacheIndex: number): void {
  const item = document.createElement('li');
  item.className = 'file-item';
  item.textContent = `📄 ${fileName}`;
  item.setAttribute('data-cache-index', cacheIndex.toString());
  fileListUI.appendChild(item);
}

function resetModContext(): void {
  fileListUI.innerHTML = '';
  loadedFileMemoryCache = [];
  activeModContext.model = undefined;
  activeModContext.mesh = undefined;
  activeModContext.skeleton = undefined;
  activeModContext.material = undefined;
  activeModContext.textures = [];
}

async function renderTargetMeshFile(meshFile: File): Promise<void> {
  try {
    const fileBuffer = await meshFile.arrayBuffer();
    const unpackedMeshData = parseSmashMesh(fileBuffer);

    if (!scene) return;
    
    const originalCube = scene.getObjectByName("placeholder_cube");
    if (originalCube) scene.remove(originalCube);
    
    const existingCharacter = scene.getObjectByName("active_character_mesh");
    if (existingCharacter) {
      if ('geometry' in existingCharacter) (existingCharacter.geometry as THREE.BufferGeometry).dispose();
      scene.remove(existingCharacter);
    }

    const meshGeometry = new THREE.BufferGeometry();
    meshGeometry.setAttribute('position', new THREE.BufferAttribute(unpackedMeshData.positions, 3));
    meshGeometry.setIndex(new THREE.BufferAttribute(unpackedMeshData.indices, 1));
    meshGeometry.computeVertexNormals();

    const renderMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x909090, 
      roughness: 0.5,
      metalness: 0.1,
      side: THREE.DoubleSide
    });

    const characterMesh = new THREE.Mesh(meshGeometry, renderMaterial);
    characterMesh.name = "active_character_mesh";
    characterMesh.position.set(0, 0, 0); 
    scene.add(characterMesh);

    console.log(`Successfully parsed and displayed selected asset mesh: ${meshFile.name}`);
  } catch (parseError) {
    console.error("Binary mesh mapping pipeline aborted:", parseError);
  }
}

async function verifyImportResults(): Promise<void> {
  if (!activeModContext.model && !activeModContext.mesh) {
    fileListUI.innerHTML = `<p style="text-align: center; color: #ff453a; font-size: 0.8rem; width: 100%;">No valid SSBU formats detected (.numdlb / .numshb).</p>`;
    return;
  }
  if (activeModContext.mesh) {
    await renderTargetMeshFile(activeModContext.mesh);
  }
}

// --- INTERACTION LISTENERS ---

const importBtn = document.getElementById('import-btn')!;

fileListUI.addEventListener('click', async (e) => {
  const targetElement = e.target as HTMLElement;
  const itemElement = targetElement.closest('.file-item');
  if (!itemElement) return;

  const rawIndex = itemElement.getAttribute('data-cache-index');
  if (rawIndex === null) return;

  const cachedFileIndex = parseInt(rawIndex, 10);
  const selectedTargetFile = loadedFileMemoryCache[cachedFileIndex];

  document.querySelectorAll('.file-item').forEach(el => el.classList.remove('active-selection'));
  itemElement.classList.add('active-selection');

  if (selectedTargetFile.name.toLowerCase().endsWith('.numshb')) {
    await renderTargetMeshFile(selectedTargetFile);
  } else if (selectedTargetFile.name.toLowerCase().endsWith('.nusktb')) {
    try {
      const fileBuffer = await selectedTargetFile.arrayBuffer();
      const skeletonData = parseSmashSkeleton(fileBuffer);

      if (!scene) return;

      const existingSkeleton = scene.getObjectByName("active_character_skeleton");
      if (existingSkeleton) scene.remove(existingSkeleton);

      const skeletonGroup = new THREE.Group();
      skeletonGroup.name = "active_character_skeleton";

      skeletonData.bones.forEach(bone => {
        const jointGeo = new THREE.SphereGeometry(0.1, 8, 8);
        const jointMat = new THREE.MeshBasicMaterial({ color: 0x30d158 });
        const jointMesh = new THREE.Mesh(jointGeo, jointMat);
        
        jointMesh.position.set(bone.position.x, bone.position.y, bone.position.z);
        skeletonGroup.add(jointMesh);
      });

      scene.add(skeletonGroup);
    } catch (skelError) {
      console.error("Failed to translate character skeleton data arrays:", skelError);
    }
  }
});

// Add this import line directly at the top of your main.ts file alongside your other modules:
import { parseSmashMaterial } from './materialParser';

// Locate your fileListUI click event handler at the bottom of main.ts, 
// and insert this extra branch directly after your existing '.nusktb' check block:

  } else if (selectedTargetFile.name.toLowerCase().endsWith('.numatb')) {
    // --- PARSING MATERIAL SHADER ATTRIBUTES ---
    try {
      const fileBuffer = await selectedTargetFile.arrayBuffer();
      const materialData = parseSmashMaterial(fileBuffer);

      console.log(`Inspecting Custom Shader properties table for: ${materialData.materialName}`);

      // Locate the active geometry mesh running on our grid stage canvas right now
      const activeMesh = scene?.getObjectByName("active_character_mesh") as THREE.Mesh;
      
      if (activeMesh && 'material' in activeMesh) {
        const meshMat = activeMesh.material as THREE.MeshStandardMaterial;

        // Smash ultimate utilizes unique property strings to assign material colors.
        // We scan for common parameters (like CustomVector3 or CustomBoolean) to update render states.
        materialData.parameters.forEach(param => {
          if (param.name.includes("CustomVector0") || param.name.includes("Diffuse")) {
            // Apply a unique surface color tint based on our parsed float properties log
            meshMat.color.setHSL(param.values[0] % 1.0, 0.5, 0.6);
            meshMat.needsUpdate = true;
          }
        });

        console.log("Success: Viewport material properties updated with custom shader color tracks!");
      } else {
        console.warn("No active character geometric sub-mesh found on screen to map material traits onto.");
      }

    } catch (matError) {
      console.error("Failed to parse or apply material properties track files:", matError);
    }
  }

async function runTauriDesktopImport() {
  try {
    const tauriApiDialog = '@tauri-apps/plugin-dialog';
    const tauriApiFs = '@tauri-apps/plugin-fs';
    
    // @ts-ignore
    const dialog = await import(/* @vite-ignore */ tauriApiDialog);
    // @ts-ignore
    const fs = await import(/* @vite-ignore */ tauriApiFs);
    
    const selectedDir = await dialog.open({ directory: true, multiple: false });
    if (!selectedDir || typeof selectedDir !== 'string') return;
    
    resetModContext();
    
    const entries = await fs.readDir(selectedDir, { recursive: true });
    for (const entry of entries) {
      if (entry.name) {
        const fileData = await fs.readBinaryFile(entry.path);
        const mockFile = new File([fileData], entry.name);
        evaluateAndStoreFile(mockFile);
      }
    }
    await verifyImportResults();
  } catch (err) {
    console.error("Desktop native filesystem error:", err);
  }
}

importBtn.addEventListener('click', (e) => {
  if ('__TAURI_METADATA__' in window) {
    e.preventDefault();
    runTauriDesktopImport();
  } else {
    folderInput.click();
  }
});

folderInput.addEventListener('change', async () => {
  if (!folderInput.files || folderInput.files.length === 0) return;
  resetModContext();
  const uploadedFiles = Array.from(folderInput.files);
  for (const file of uploadedFiles) {
    evaluateAndStoreFile(file);
  }
  await verifyImportResults();
});
