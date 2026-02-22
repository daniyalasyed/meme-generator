"use client";

import { init } from "@instantdb/react";

export const INSTANT_APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID ?? "";

export const db = init({
  appId: INSTANT_APP_ID
});
