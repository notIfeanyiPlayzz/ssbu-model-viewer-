import { BinaryReader } from './binaryReader';

export interface SmashBone {
  name: string;
  parentIndex: number;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number; w: number };
}

export interface UnpackedSkeleton {
  bones: SmashBone[];
}

/**
 * Low-level binary chunk extractor for SSBU .nusktb files
 */
export function parseSmashSkeleton(buffer: ArrayBuffer): UnpackedSkeleton {
  const reader = new BinaryReader(buffer);

  // 1. Verify Format Magic Signature
  const magic = reader.readStringFixed(4);
  if (magic !== "SKEL") {
    throw new Error("Invalid format footprint: Byte signature does not equal SKEL");
  }

  reader.skip(4); // Skip minor/major version bytes
  const boneCount = reader.readUint32();
  const boneDataOffset = reader.readUint32();

  console.log(`Extracting bone structures: Total joints discovered: ${boneCount}`);
  const bones: SmashBone[] = [];

  // 2. Map Bone Transform Matrices and Metadata Offsets
  reader.seek(boneDataOffset);

  for (let i = 0; i < boneCount; i++) {
    const nameOffset = reader.readUint32();
    const parentBoneIdx = reader.readInt32(); // -1 means it is a root node base track joint
    const currentPos = reader.getPosition();

    // Jump sideways to extract the bone's label string sequence
    reader.seek(nameOffset);
    const boneName = reader.readStringNullTerminated();
    reader.seek(currentPos);

    // Read transform vectors (Nintendo transforms characters using 3D position coordinates and Quaternions)
    const posX = reader.readFloat32();
    const posY = reader.readFloat32();
    const posZ = reader.readFloat32();

    const rotX = reader.readFloat32();
    const rotY = reader.readFloat32();
    const rotZ = reader.readFloat32();
    const rotW = reader.readFloat32();

    bones.push({
      name: boneName,
      parentIndex: parentBoneIdx,
      position: { x: posX * 0.1, y: posY * 0.1, z: posZ * 0.1 }, // Scale relative to mesh dimensions
      rotation: { x: rotX, y: rotY, z: rotZ, w: rotW }
    });
  }

  return { bones };
}
