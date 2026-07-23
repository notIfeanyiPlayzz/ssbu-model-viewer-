export interface SSBUModFiles {
  model?: File;    // .numdlb
  mesh?: File;     // .numshb
  skeleton?: File; // .nusktb
  material?: File; // .numatb
  textures: File[]; // .nutexb arrays
}
