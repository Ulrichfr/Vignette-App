// Vignette desktop/mobile — coque Tauri v2 autour de la web app (apps/web).
//
// La fenêtre principale montre la vue « Toutes les notes ». Le geste signature
// (post-its dockés au bord de l'écran, par-dessus le bureau) viendra ici :
// une WebviewWindow frameless + always_on_top + transparente par note dockée,
// positionnée au bord du moniteur via tauri-plugin-positioner.

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default().plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init());

    #[cfg(desktop)]
    let builder = builder
        .plugin(tauri_plugin_positioner::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init());

    builder
        .run(tauri::generate_context!())
        .expect("erreur au lancement de Vignette");
}
