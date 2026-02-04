import { Client } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";
import fs from "fs";

const notion = new Client({
  auth: process.env.NOTION_API_KEY
});

const n2m = new NotionToMarkdown({ notionClient: notion });
const DATABASE_ID = process.env.NOTION_DATABASE_ID;

async function fetchPosts() {
  const res = await notion.databases.query({
    database_id: DATABASE_ID,
    filter: {
      and: [
        { property: "Status", select: { equals: "Published" } },
        { property: "Publish", checkbox: { equals: true } }
      ]
    }
  });

  if (!fs.existsSync("src/posts")) {
    fs.mkdirSync("src/posts", { recursive: true });
  }

  for (const page of res.results) {
    const title = page.properties.Title.title[0]?.plain_text || "";
    const slug = page.properties.Slug.rich_text[0]?.plain_text;
    const description =
      page.properties.Description?.rich_text[0]?.plain_text || "";

    if (!slug) continue;

    const mdBlocks = await n2m.pageToMarkdown(page.id);
    const mdString = n2m.toMarkdownString(mdBlocks);

    const content = `---
title: "${title}"
description: "${description}"
slug: "${slug}"
layout: layout.njk
---

${mdString}
`;

    fs.writeFileSync(`src/posts/${slug}.md`, content);
  }
}

fetchPosts();
