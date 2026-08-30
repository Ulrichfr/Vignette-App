// Vignette desktop/mobile — coque Tauri v2 autour de la web app (apps/web).
//
// La fenêtre principale montre la vue « Toutes les notes ». Les post-its sur
// le bureau sont des WebviewWindow frameless créées côté JS (lib/float.ts).
// Ici, le desktop gagne en plus une icône de zone de notifications (afficher/
// masquer, nouvelle note, quitter) et un raccourci global Ctrl/Cmd+Maj+N qui
// crée une note depuis n'importe où.

#[cfg(desktop)]
fn show_main(app: &tauri::AppHandle) {
    use tauri::Manager;
    if let Some(w) = app.get_webview_window("main") {
        let _ = w.show();
        let _ = w.unminimize();
        let _ = w.set_focus();
    }
}

#[cfg(desktop)]
fn new_note(app: &tauri::AppHandle) {
    use tauri::Emitter;
    show_main(app);
    let _ = app.emit_to("main", "vignette://nouvelle-note", ());
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init());

    #[cfg(desktop)]
    let builder = builder
        .plugin(tauri_plugin_positioner::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_shortcuts(["CommandOrControl+Shift+N"])
                .expect("raccourci global invalide")
                .with_handler(|app, _shortcut, event| {
                    if event.state == tauri_plugin_global_shortcut::ShortcutState::Pressed {
                        new_note(app);
                    }
                })
                .build(),
        )
        .setup(|app| {
            use tauri::menu::{MenuBuilder, MenuItemBuilder};
            use tauri::tray::TrayIconBuilder;

            let afficher = MenuItemBuilder::with_id("afficher", "Afficher Vignette").build(app)?;
            let nouvelle =
                MenuItemBuilder::with_id("nouvelle", "Nouvelle note\tCtrl+Maj+N").build(app)?;
            let quitter = MenuItemBuilder::with_id("quitter", "Quitter").build(app)?;
            let menu = MenuBuilder::new(app)
                .item(&afficher)
                .item(&nouvelle)
                .separator()
                .item(&quitter)
                .build()?;

            TrayIconBuilder::with_id("vignette-tray")
                .icon(app.default_window_icon().expect("icône absente").clone())
                .tooltip("Vignette")
                .menu(&menu)
                .show_menu_on_left_click(true)
                .on_menu_event(|app, event| match event.id().as_ref() {
                    "afficher" => show_main(app),
                    "nouvelle" => new_note(app),
                    "quitter" => app.exit(0),
                    _ => {}
                })
                .build(app)?;
            Ok(())
        });

    builder
        .run(tauri::generate_context!())
        .expect("erreur au lancement de Vignette");
}
