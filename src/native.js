import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { App } from "@capacitor/app";
export const isNativeApp = Capacitor.isNativePlatform();
const KEY = "lifesim-native-snapshot-v1";
let queue = Promise.resolve(),
  blocked = false;
export async function hydrateNativeSave() {
  if (!isNativeApp) return "";
  try {
    const { value } = await Preferences.get({ key: KEY });
    if (!value) return "";
    const data = JSON.parse(value);
    if (
      !data ||
      typeof data !== "object" ||
      Array.isArray(data) ||
      Object.entries(data).some(
        ([k, v]) => !k.startsWith("lifesim-save-v1") || typeof v !== "string",
      )
    )
      throw new Error("Invalid native save snapshot");
    for (const [k, v] of Object.entries(data)) localStorage.setItem(k, v);
    return "";
  } catch (error) {
    blocked = true;
    return "Your native save could not be restored. It has been kept untouched; export your current game before leaving and retry after reopening the app.";
  }
}
export function persistNativeSave() {
  if (!isNativeApp || blocked) return Promise.resolve();
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith("lifesim-save-v1"))
      data[key] = localStorage.getItem(key);
  }
  const value = JSON.stringify(data);
  queue = queue
    .catch(() => {})
    .then(() => Preferences.set({ key: KEY, value }));
  return queue;
}
export function resumeNativeSaving() {
  blocked = false;
}
export async function nativeFeedback() {
  if (!isNativeApp) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    /* Haptics are optional on unsupported devices. */
  }
}
export async function shareNativeSave(text, filename) {
  const path = filename.replace(/[^a-zA-Z0-9._-]/g, "-");
  const result = await Filesystem.writeFile({
    path,
    data: text,
    directory: Directory.Cache,
    encoding: Encoding.UTF8,
  });
  await Share.share({
    title: "Lifesim save backup",
    files: [result.uri],
    dialogTitle: "Keep your life safe",
  });
}
if (isNativeApp)
  void App.addListener("appStateChange", ({ isActive }) => {
    if (!isActive) void persistNativeSave().catch(() => {});
  });
