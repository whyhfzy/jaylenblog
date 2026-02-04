import { Client } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";
import fs from "fs";

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const n2m = new NotionToMarkdown({ notionClient: notion });
const DATABASE_ID = process.env.NOTION_DATABASE_ID;

// 安全读取 Notion 文本
function getText(prop) {
  if (!prop) return "";
  if (prop.title && prop.title.length > 0) {
    return prop.title[0].plain_text;
  }
  if (prop.rich_text && prop.rich_text.length > 0) {
    return prop.rich_text[0].plain_text;
  }
  return "";
}

async function fetchPosts() {
  if (!DATABASE_ID) {
    throw new Error("NOTION_DATABASE_ID is missing");
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

  if
