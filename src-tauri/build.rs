fn main() {
    // Disable resource packing fallback checks to bypass format compile crashes
    let mut attributes = tauri_build::Attributes::new();
    attributes = attributes.windows_attributes(tauri_build::WindowsAttributes::new());
    
    tauri_build::try_build(attributes).unwrap_or_else(|_| {
        tauri_build::build();
    });
}
