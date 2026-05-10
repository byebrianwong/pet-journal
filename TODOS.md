# TODOs

## Deferred from QA pass on 2026-05-09

### Multi-pet switcher (medium)
All screens currently hardcode `pets[0]` — TimelineScreen, PetProfileScreen, MedicationsTabWrapper. With ≥2 pets, only the first one is ever visible. Now that "Add another pet" is reachable from PetProfileScreen, this gap will start mattering.

Design questions:
- Pet switcher in PetHeader (tap-to-switch dropdown)?
- Pet list page in Profile that becomes the home view when ≥2?
- Per-tab pet selector?

Files: `src/screens/TimelineScreen.tsx:43`, `src/screens/PetProfileScreen.tsx:16`, `App.tsx:88` (MedicationsTabWrapper).

### Real time picker for medication reminders (low)
`MedicationsScreen` modal currently uses a `<TextInput placeholder="HH:MM (24h)" />` for reminder time. Functional but error-prone. Switch to `@react-native-community/datetimepicker` (works on iOS/Android natively) with a web fallback to `<input type="time">`.

File: `src/screens/MedicationsScreen.tsx:131`.

### AddEntryScreen choose-mode header polish (low)
Three-option screen ("Memory / Vet Visit / Scan Receipt") works but the heading just reads "Add Entry" without subtitle/explanation. Could use the same first-run-style empty-state styling.

File: `src/screens/AddEntryScreen.tsx:155`.

### "shadow*" deprecation warnings (low)
react-native-web warns `"shadow*" style props are deprecated. Use "boxShadow"` for several styles. Doesn't break anything — just clutters the console. Mostly in `App.tsx` (SetupRequiredScreen, FAB) and `src/screens/TimelineScreen.tsx` (FAB shadow).
