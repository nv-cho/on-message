import {
  http,
  createWalletClient,
  createPublicClient,
} from "@arkiv-network/sdk";
import { mendoza } from "@arkiv-network/sdk/chains";

export type ArkivPublicClient = ReturnType<typeof createPublicClient>;
export type ArkivWalletClient = ReturnType<typeof createWalletClient>;

export const ARKIV_CHAIN = mendoza;
export const ARKIV_PRIVATE_KEY = process.env
  .PRIVATE_KEY_USER_A! as `0x${string}`;
export const ARKIV_RPC_HTTP_URL =
  process.env.NEXT_PUBLIC_ARKIV_RPC_HTTP_URL ??
  "https://mendoza.hoodi.arkiv.network/rpc";

export const transport = http(ARKIV_RPC_HTTP_URL);
