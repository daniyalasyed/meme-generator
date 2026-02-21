"use client";

import { init } from "@instantdb/react";

export const INSTANT_APP_ID =
  process.env.NEXT_PUBLIC_INSTANT_APP_ID ?? "e7205fc9-6be1-415f-b6e1-1fe55e827147";

export const db = init({
  appId: INSTANT_APP_ID
});
