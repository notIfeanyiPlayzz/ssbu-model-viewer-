import { BinaryReader } from './binaryReader';

export interface SmashMaterialParam {
  name: string;
  values: number[];
}

export interface UnpackedMaterial {
  materialName: string;
  shaderLabel: string;
  parameters: SmashMaterialParam[];
}

/**
 * Low-level byte stream reader for SSBU .numatb material files
 */
export function parseSmashMaterial(buffer: ArrayBuffer): UnpackedMaterial {
  const reader = new BinaryReader(buffer);

  // 1. Verify Format Magic Signature Footer
  const magic = reader.readStringFixed(4);
  if (magic !== "MATL") {
    throw new Error("Invalid format footprint: Byte signature does not equal MATL");
  }

  reader.skip(4); // Skip minor/major version revisions
  const entriesCount = reader.readUint32();
  const dataOffset = reader.readUint32();

  console.log(`Extracting material parameters: Found ${entriesCount} configuration blocks`);

  // Jump to the primary properties index offset pointer
  reader.seek(dataOffset);

  const materialNameOffset = reader.readUint32();
  const shaderLabelOffset = reader.readUint32();
  const paramCount = reader.readUint32();

  // Extract text definitions for resource tracking layers
  reader.seek(materialNameOffset);
  const materialName = reader.readStringNullTerminated();

  reader.seek(shaderLabelOffset);
  const shaderLabel = reader.readStringNullTerminated();

  const parameters: SmashMaterialParam[] = [];

  // 2. Loop through individual material property nodes (colors, texture IDs, flags)
  // (We target basic data footprints to safely avoid complex variable structures)
  reader.seek(dataOffset + 12); 
  for (let i = 0; i < Math.min(paramCount, 20); i++) {
    const paramIDOffset = reader.readUint32();
    const dataValueOffset = reader.readUint32();
    const currentPosition = reader.getPosition();

    reader.seek(paramIDOffset);
    const paramName = reader.readStringNullTerminated();

    reader.seek(dataValueOffset);
    // Real engines unpack multi-byte float sets; we sample the first float block for diffuse tracking maps
    const floatValue = reader.readFloat32(); 

    parameters.push({
      name: paramName,
      values: [floatValue]
    });

    reader.seek(currentPosition);
  }

  return {
    materialName,
    shaderLabel,
    parameters
  };
}
