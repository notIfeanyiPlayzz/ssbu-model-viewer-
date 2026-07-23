# ssbu-model-viewer
![App Version](https://img.shields.io/badge/App_Version-v0.1.0-blue)
![Platform](https://img.shields.io/badge/Platform-Web%2FDesktop-0a84ff)
![Build Status](https://img.shields.io/badge/build-passing-green)



SSBU Model Viewer (SSBUMV) is a web and application tool that let's you view .numshb, .numsktb, .nuhlpb, .numshexb, .numatb, .numdlb, and nutexb files

# Features
## 📁 Supported SSBU File Formats

The following table tracks the development progress of `ssbu-model-viewer` for importing, parsing, editing, and rendering proprietary Super Smash Bros. Ultimate format structures:

| File Type | Extension | Description | Editing Capabilities | Viewport Rendering |
| :--- | :--- | :--- | :---: | :---: |
| **Adj** | `.adjb` | Renormal mesh adjacency data | ✅ | ✅ |
| **Anim** | `.nuanmb` | Skeletal and material animation tracks | ✅ | ✅ |
| **Hlpb** | `.nuhlpb` | Helper bone physics constraints data | ✅ | ✅ |
| **Matl** | `.numatb` | Shader materials parameter maps | ✅ | ✅ |
| **Mesh** | `.numshb` | Raw vertex coordinates buffer sheets | ✅ | ✅ |
| **MeshEx** | `.numshexb` | Mesh face bounding spheres and flags | ✅ | ✅ |
| **Modl** | `.numdlb` | Link assignments mapping materials to meshes | ✅ | ✅ |
| **Skel** | `.nusktb` | Bone hierarchy structure rigging grids | ✅ | ✅ |
| **Tex** | `.nutexb` | Compressed proprietary image wrapper sheets | ❌ | ✅ |
| **Xmb** | `.xmb` | Level of Detail (LOD) parameter records | ❌ | ✅ |
| **Prc** | `.prc` | Parameter values guiding bone swing physics | ❌ | ✅ |

# Installation
To install SSBUMV, you have 2 options.
## Web Version
To install:
```bash
npm install
npm run dev
```
## Desktop Version
```bash
npm install
npx tauri dev
```



