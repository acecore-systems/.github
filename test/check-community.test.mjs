import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import {
  validateForm,
  validateConfig,
  validateRepository,
} from "../scripts/check-community.mjs";

const form = () => ({
  name: "不具合",
  description: "不具合の報告",
  body: [
    {
      type: "textarea",
      id: "summary",
      attributes: { label: "概要" },
      validations: { required: true },
    },
  ],
});

async function repository(t, files) {
  const root = await mkdtemp(path.join(tmpdir(), "acecore-community-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const [file, content] of Object.entries(files)) {
    await mkdir(path.dirname(path.join(root, file)), { recursive: true });
    await writeFile(path.join(root, file), content);
  }
  return root;
}

test("accepts a valid form, including supported optional field types", () => {
  const value = form();
  value.body.push(
    { type: "markdown", attributes: { value: "説明" } },
    { type: "input", attributes: { label: "URL" } },
    {
      type: "dropdown",
      attributes: { label: "OS", options: ["Windows", "Linux"] },
    },
    {
      type: "checkboxes",
      attributes: {
        label: "確認",
        options: [{ label: "確認済み", required: true }],
      },
    },
    { type: "upload", attributes: { label: "添付" } },
  );
  assert.deepEqual(validateForm(value), []);
});

test("rejects missing required keys, invalid fields and malformed validations", () => {
  for (const key of ["name", "description", "body"]) {
    const value = form();
    delete value[key];
    assert.ok(validateForm(value).some((error) => error.startsWith(key)));
  }
  for (const field of [
    null,
    { type: "invalid" },
    { type: "input" },
    { type: "input", attributes: {} },
  ]) {
    const value = form();
    value.body = [field];
    assert.ok(validateForm(value).length > 0);
  }
  const value = form();
  value.body[0].validations.required = "true";
  assert.match(validateForm(value).join("\n"), /must be a boolean/);
});

test("rejects duplicate or invalid IDs and duplicate labels", () => {
  const value = form();
  value.body.push(structuredClone(value.body[0]));
  assert.match(validateForm(value).join("\n"), /id duplicates/);
  assert.match(validateForm(value).join("\n"), /label duplicates/);
  value.body = [{ ...value.body[0], id: "not valid!" }];
  assert.match(validateForm(value).join("\n"), /id must contain/);
});

test("rejects markdown-only forms and invalid selection options", () => {
  const value = form();
  value.body = [{ type: "markdown", attributes: { value: "説明" } }];
  assert.match(validateForm(value).join("\n"), /at least one input/);
  for (const [type, options] of [
    ["dropdown", []],
    ["dropdown", [false]],
    ["checkboxes", [{ label: "確認", required: "yes" }]],
  ]) {
    value.body = [{ type, attributes: { label: "選択", options } }];
    assert.match(validateForm(value).join("\n"), /options/);
  }
});

test("validates blank issue and contact link configuration", () => {
  const value = {
    blank_issues_enabled: true,
    contact_links: [
      {
        name: "Security",
        about: "Read the policy",
        url: "https://example.com/security",
      },
    ],
  };
  assert.deepEqual(validateConfig(value), []);
  assert.ok(validateConfig({ blank_issues_enabled: "true" }).length > 0);
  assert.ok(validateConfig({ contact_links: {} }).length > 0);
  for (const link of [
    null,
    {},
    { name: "Security", about: "Policy", url: "../SECURITY.md" },
    { name: "Security", about: "Policy", url: "javascript:alert(1)" },
  ]) {
    assert.ok(validateConfig({ contact_links: [link] }).length > 0);
  }
});

test("accepts existing nested, encoded, reference, image and root-relative links", async (t) => {
  const root = await repository(t, {
    "README.md":
      "[Guide](docs/guide.md#heading)\n[File](docs/a%20b.md)\n[Reference][guide]\n\n[guide]: docs/guide.md\n\n![Image](docs/icon.svg)\n[Web](https://example.invalid/)\n`[Example](missing.md)`\n",
    "docs/guide.md":
      "[Home](../README.md)\n[Root](/README.md)\n[Section](#heading)\n",
    "docs/a b.md": "# Text\n",
    "docs/icon.svg": "<svg/>\n",
    "node_modules/example/broken.md": "[Missing](missing.md)\n",
    ".github/ISSUE_TEMPLATE/bug.yml": JSON.stringify(form()),
    ".github/ISSUE_TEMPLATE/config.yml": "blank_issues_enabled: true\n",
  });
  assert.deepEqual(await validateRepository(root), []);
});

test("reports missing link targets, including references, with the source line", async (t) => {
  const root = await repository(t, {
    "README.md":
      "[Broken](missing.md)\n[Ref][missing]\n\n[missing]: missing-too.md\n",
  });
  const errors = await validateRepository(root);
  assert.equal(errors.length, 2);
  assert.match(errors[0], /README.md: line 1:.*missing.md/);
  assert.match(errors[1], /README.md: line 2:.*missing-too.md/);
});

test("rejects paths escaping the repository and malformed percent encoding", async (t) => {
  const root = await repository(t, {
    "README.md": "[Outside](../file.md)\n[Malformed](bad%ZZ.md)\n",
  });
  assert.equal((await validateRepository(root)).length, 2);
});

test("rejects malformed YAML and duplicate mapping keys in any YAML file", async (t) => {
  const root = await repository(t, {
    ".github/ISSUE_TEMPLATE/bug.yml": "body: [\n",
    ".github/workflows/check.yml": "name: One\nname: Two\n",
  });
  const errors = await validateRepository(root);
  assert.equal(errors.length, 2);
  assert.ok(
    errors.some((error) => error.startsWith(".github/workflows/check.yml:")),
  );
});

test("rejects duplicate form names across files", async (t) => {
  const root = await repository(t, {
    ".github/ISSUE_TEMPLATE/one.yml": JSON.stringify(form()),
    ".github/ISSUE_TEMPLATE/two.yml": JSON.stringify(form()),
  });
  assert.match(
    (await validateRepository(root)).join("\n"),
    /name duplicates another form/,
  );
});
