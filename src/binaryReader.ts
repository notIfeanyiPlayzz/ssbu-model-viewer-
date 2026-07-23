export class BinaryReader {
  private view: DataView;
  private offset: number = 0;
  public length: number;

  constructor(buffer: ArrayBuffer) {
    this.view = new DataView(buffer);
    this.length = buffer.byteLength;
  }

  // Get current processing byte position index
  public getPosition(): number {
    return this.offset;
  }

  // Jump to a specific byte address marker location
  public seek(position: number): void {
    if (position < 0 || position > this.length) {
      throw new Error(`Seek destination target offset out of bounds: ${position}`);
    }
    this.offset = position;
  }

  // Advance forward by an explicit count multiplier
  public skip(bytes: number): void {
    this.seek(this.offset + bytes);
  }

  // Read a single 8-bit unsigned integer byte component
  public readUint8(): number {
    const value = this.view.getUint8(this.offset);
    this.offset += 1;
    return value;
  }

  // Read a 16-bit short integer (Little Endian format default for Nintendo Switch)
  public readUint16(littleEndian: boolean = true): number {
    const value = this.view.getUint16(this.offset, littleEndian);
    this.offset += 2;
    return value;
  }

  // Read a standard 32-bit integer block
  public readUint32(littleEndian: boolean = true): number {
    const value = this.view.getUint32(this.offset, littleEndian);
    this.offset += 4;
    return value;
  }

  // Read a 32-bit floating point number (used for X, Y, Z dimensional coordinates)
  public readFloat32(littleEndian: boolean = true): number {
    const value = this.view.getFloat32(this.offset, littleEndian);
    this.offset += 4;
    return value;
  }

  // Read a text string up to a null-terminator byte chunk (\0)
  public readStringNullTerminated(): string {
    let result = "";
    while (this.offset < this.length) {
      const byte = this.readUint8();
      if (byte === 0) break; // Break out when terminator character is touched
      result += String.fromCharCode(byte);
    }
    return result;
  }

  // Read an exact length fixed length text block sequence
  public readStringFixed(length: number): string {
    let result = "";
    for (let i = 0; i < length; i++) {
      result += String.fromCharCode(this.readUint8());
    }
    return result;
  }
}
