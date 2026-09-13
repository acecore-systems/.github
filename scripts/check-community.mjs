import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parseDocument } from "yaml";
import { unified } from "unified";
import remarkParse from "remark-parse";

const markdown = unified().use(remarkParse);
const inputTypes = new Set([
  "checkboxes",
  "dropdown",
  "input",
  "markdown",
  "textarea",
  "upload",
]);
const isObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const isText = (value) => typeof value === "string" && value.trim().length > 0;

// This checks the form structure used by this repository, not every GitHub option.
export function validateForm(form) {
  const errors = [];
  if (!isObject(form)) return ["form must be a mapping"];
  for (const key of ["name", "description"]) {
    if (!isText(form[key])) errors.push(`${key} must be a non-empty string`);
  }
  if (!Array.isArray(form.body) || form.body.length === 0) {
    return [...errors, "body must be a non-empty array"];
  }
  const ids = new Set();
  const labels = new Set();
  let inputs = 0;
  form.body.forEach((field, index) => {
    const location = `body[${index}]`;
    if (!isObject(field) || !inputTypes.has(field.type)) {
      errors.push(`${location}.type must be a supported GitHub input type`);
      return;
    }
    if (field.id !== undefined) {
      if (typeof field.id !== "string" || !/^[A-Za-z0-9_-]+$/.test(field.id)) {
        errors.push(
          `${location}.id must contain only letters, numbers, _ or -`,
        );
      } else if (ids.has(field.id)) {
        errors.push(`${location}.id duplicates ${field.id}`);
      }
      ids.add(field.id);
    }
    if (!isObject(field.attributes)) {
      errors.push(`${location}.attributes must be a mapping`);
      return;
    }
    const attributes = field.attributes;
    if (field.type === "markdown") {
      if (!isText(attributes.value))
        errors.push(`${location}.attributes.value must be text`);
    } else {
      inputs += 1;
      if (!isText(attributes.label)) {
        errors.push(`${location}.attributes.label must be text`);
      } else if (labels.has(attributes.label)) {
        errors.push(
          `${location}.attributes.label duplicates ${attributes.label}`,
        );
      }
      labels.add(attributes.label);
    }
    if (
      field.validations !== undefined &&
      (!isObject(field.validations) ||
        (field.validations.required !== undefined &&
          typeof field.validations.required !== "boolean"))
    ) {
      errors.push(`${location}.validations.required must be a boolean`);
    }
    if (["dropdown", "checkboxes"].includes(field.type)) {
      if (
        !Array.isArray(attributes.options) ||
        attributes.options.length === 0
      ) {
        errors.push(`${location}.attributes.options must be a non-empty array`);
      } else {
        for (const option of attributes.options) {
          const valid =
            field.type === "dropdown"
              ? isText(option)
              : isObject(option) &&
                isText(option.label) &&
                (option.required === undefined ||
                  typeof option.required === "boolean");
          if (!valid)
            errors.push(
              `${location}.attributes.options contains an invalid option`,
            );
        }
      }
    }
  });
  if (inputs === 0) errors.push("body must include at least one input field");
  return errors;
}

export function validateConfig(config) {
  if (!isObject(config)) return ["config must be a mapping"];
  const errors = [];
  if (
    config.blank_issues_enabled !== undefined &&
    typeof config.blank_issues_enabled !== "boolean"
  ) {
    errors.push("blank_issues_enabled must be a boolean");
  }
  if (config.contact_links !== undefined) {
    if (!Array.isArray(config.contact_links))
      return [...errors, "contact_links must be an array"];
    config.contact_links.forEach((link, index) => {
      if (!isObject(link) || !isText(link.name) || !isText(link.about)) {
        errors.push(`contact_links[${index}] requires name and about text`);
      }
      try {
        if (
          !isText(link?.url) ||
          !["https:", "http:"].includes(new URL(link.url).protocol)
        )
          throw new Error();
      } catch {
        errors.push(
          `contact_links[${index}].url must be an absolute HTTP(S) URL`,
        );
      }
    });
  }
  return errors;
}

async function listFiles(directory, prefix = "") {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if ([".git", "node_modules", ".worktrees"].includes(entry.name)) continue;
    const relative = prefix + entry.name;
    if (entry.isDirectory())
      files.push(
        ...(await listFiles(path.join(directory, entry.name), relative + "/")),
      );
    else if (entry.isFile()) files.push(relative);
  }
  return files;
}

function* walk(node) {
  yield node;
  for (const child of node.children ?? []) yield* walk(child);
}

async function validateLinks(source, file, root) {
  const errors = [];
  const nodes = [...walk(markdown.parse(source))];
  const definitions = new Map(
    nodes
      .filter((node) => node.type === "definition")
      .map((node) => [node.identifier, node.url]),
  );
  for (const node of nodes) {
    if (
      !["link", "image", "linkReference", "imageReference"].includes(node.type)
    )
      continue;
    const url = node.url ?? definitions.get(node.identifier);
    if (!url || /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(url)) continue;
    try {
      const target = decodeURIComponent(url.split(/[?#]/, 1)[0]);
      if (!target) continue;
      const resolved = target.startsWith("/")
        ? path.resolve(root, "." + target)
        : path.resolve(root, path.dirname(file), target);
      const relative = path.relative(root, resolved);
      if (
        relative === ".." ||
        relative.startsWith(".." + path.sep) ||
        path.isAbsolute(relative)
      ) {
        throw new Error("target is outside this repository");
      }
      await stat(resolved);
    } catch {
      errors.push(
        `line ${node.position.start.line}: relative link target does not exist in this repository: ${url}`,
      );
    }
  }
  return errors;
}

export async function validateRepository(root) {
  const errors = [];
  const names = new Set();
  for (const file of await listFiles(root)) {
    if (!/\.(?:md|ya?ml)$/i.test(file)) continue;
    const source = await readFile(path.join(root, file), "utf8");
    let issues = [];
    if (/\.md$/i.test(file)) {
      issues = await validateLinks(source, file, root);
    } else {
      const document = parseDocument(source, { uniqueKeys: true });
      if (document.errors.length) {
        issues = document.errors.map((error) => error.message);
      } else if (file.startsWith(".github/ISSUE_TEMPLATE/")) {
        const data = document.toJS();
        if (/\/config\.ya?ml$/.test(file)) issues = validateConfig(data);
        else {
          issues = validateForm(data);
          if (isText(data?.name)) {
            if (names.has(data.name))
              issues.push(`name duplicates another form: ${data.name}`);
            names.add(data.name);
          }
        }
      }
    }
    errors.push(...issues.map((issue) => `${file}: ${issue}`));
  }
  return errors;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  const errors = await validateRepository(process.cwd());
  if (errors.length) {
    console.error(errors.join("\n"));
    process.exitCode = 1;
  } else {
    console.log("Community forms, YAML and relative Markdown links are valid.");
  }
}
