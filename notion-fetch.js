const { Client } = require("@notionhq/client");
const { NotionToMarkdown } = require("notion-to-md");
const fs = require("fs");

const notion = new Client({
  auth: process.env.NOTION_API_KEY || "",
});

const n2m = new NotionToMarkdown({ notionClient: notion });
const DATABASE_ID = process.env.NOTION_DATABASE_ID || "";

function getText(prop) {
  if (!prop) return "";
  if (prop.title?.length) return prop.title[0].plain_text;
  if (prop.rich_text?.length) return prop.rich_text[0].plain_text;
  return "";
}

async function fetchPosts() {
  // ❗关键：环境变量不完整，直接跳过，而不是 throw
  if (!DATABASE_ID || !process.env.NOTION_API_KEY) {
    console.warn("Notion env missing, skip fetching posts");
    return;
  }

  const res = await notion.databases.query({
    database_id: DATABASE_ID,
    filter: {
      and: [
        { property: "Status", select: { equals: "Published" } },
        { property: "Publish", checkbox: { equals: true } },
      ],
    },
  });

  fs.mkdirSync("src/posts", { recursive: true });

  for (const page of res.results) {
    const slug = getText(page.properties.Slug);
    if (!slug) continue;

    const title = getText(page.properties.Title);
    const description = getText(page.properties.Description);

    const mdBlocks = await n2m.pageToMarkdown(page.id);
    const md = n2m.toMarkdownString(mdBlocks);

    fs.writeFileSync(
      `src/posts/${slug}.md`,
      `---
title: "${title}"
description: "${description}"
slug: "${slug}"
layout: layout.njk
---

${md}
`
    );
  }
}

// ❗关键：任何异常都只记录，不终止 build
fetchPosts().catch((err) => {
  console.error("Notion fetch error (ignored):", err.message);
});
