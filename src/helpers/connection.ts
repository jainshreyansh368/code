import { Connection, clusterApiUrl } from "@solana/web3.js";

export const getConnection = async () => {
    return new Connection(clusterApiUrl('devnet')
    , "confirmed")
}