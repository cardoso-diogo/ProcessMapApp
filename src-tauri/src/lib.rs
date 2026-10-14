#[tauri::command]
async fn save_project(default_name: String, contents: String) -> Result<Option<String>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let selected = rfd::FileDialog::new()
            .add_filter("Process Map Builder project", &["json"])
            .set_file_name(&default_name)
            .save_file();

        let Some(mut path) = selected else {
            return Ok(None);
        };
        if path.extension().is_none() {
            path.set_extension("json");
        }
        std::fs::write(&path, contents)
            .map_err(|error| format!("Could not save project: {error}"))?;
        Ok(Some(path.to_string_lossy().into_owned()))
    })
    .await
    .map_err(|error| format!("Save dialog failed: {error}"))?
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![save_project])
        .run(tauri::generate_context!())
        .expect("failed to run Process Map Builder");
}
