import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const FONT_NAMES = ["valvepulp-bold.ttf", "valvepulp_bold.ttf", "ValvePulp-Bold.ttf"];

/**
 * Valve Pulp ships inside the player's Deadlock install. This only returns
 * that existing file. It never copies the font into the app.
 */
export function findLocalPulpFont(): string | null {
  for (const fontsDir of fontDirectories()) {
    for (const name of FONT_NAMES) {
      const file = path.join(fontsDir, name);
      try {
        const stat = fs.statSync(file);
        if (stat.isFile() && stat.size > 0 && stat.size < 8_000_000) return file;
      } catch {
        // Not installed on this library.
      }
    }
  }
  return null;
}

function fontDirectories(): string[] {
  const dirs: string[] = [];
  for (const root of steamRoots()) {
    const libraries = readLibraryPaths(path.join(root, "steamapps", "libraryfolders.vdf"));
    const roots = libraries.length > 0 ? libraries : [root];
    for (const library of roots) {
      dirs.push(
        path.join(
          library,
          "steamapps",
          "common",
          "Deadlock",
          "game",
          "citadel",
          "panorama",
          "fonts",
        ),
      );
    }
  }
  return dirs;
}

function steamRoots(): string[] {
  const home = os.homedir();
  const roots = [
    process.env["ProgramFiles(x86)"]
      ? path.join(process.env["ProgramFiles(x86)"], "Steam")
      : "",
    process.env.ProgramFiles ? path.join(process.env.ProgramFiles, "Steam") : "",
    "C:\\Program Files (x86)\\Steam",
    "C:\\Program Files\\Steam",
    path.join(home, ".steam", "steam"),
    path.join(home, ".local", "share", "Steam"),
    path.join(home, ".var", "app", "com.valvesoftware.Steam", "data", "Steam"),
  ];
  return roots.filter((root) => {
    try {
      return fs.existsSync(root);
    } catch {
      return false;
    }
  });
}

function readLibraryPaths(vdfPath: string): string[] {
  let text: string;
  try {
    text = fs.readFileSync(vdfPath, "utf8");
  } catch {
    return [];
  }
  const paths: string[] = [];
  for (const match of text.matchAll(/"path"\s+"([^"]+)"/g)) {
    const folder = match[1].replace(/\\\\/g, "\\");
    if (folder) paths.push(folder);
  }
  return paths;
}
