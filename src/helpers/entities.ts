import { Keypair } from "@solana/web3.js";
import * as bs58 from "bs58";

export const getPayer = async () => {
    const payer: Keypair = Keypair.fromSecretKey(
        bs58.decode(
            "4tMjcq689pXGxSN5Y7iAHQSCCua5vYQqSQzitUupCJorNn3RR7pq4VaE8LsRbxHe4kk6NgR7HfDwzwTyPkSvKhzD"
        )
    );
    console.log("payer.publicKey",payer.publicKey.toString());

    return payer;
}


export const getOwner = async () => {
    const owner: Keypair = Keypair.fromSecretKey(
        bs58.decode(
            "4tMjcq689pXGxSN5Y7iAHQSCCua5vYQqSQzitUupCJorNn3RR7pq4VaE8LsRbxHe4kk6NgR7HfDwzwTyPkSvKhzD"
        )
    );
    console.log("owner.publicKey",owner.publicKey.toString());

    return owner;
}

export const getdepo = async () => {
    const depo: Keypair = Keypair.fromSecretKey(
        bs58.decode(
            "4EqBZmedhS46D9MmUombosaPu61YRXSE8YSHbCnhRPFHNA5QJij9QChTtM3HJi415ZUDJxXwZdTiVSa6srEuZVXh"
        )
    );
    console.log("depo.publicKey",depo.publicKey.toString());

    return depo;
}



export const getuser = async () => {
    const User: Keypair = Keypair.fromSecretKey(
        bs58.decode(
            "4EqBZmedhS46D9MmUombosaPu61YRXSE8YSHbCnhRPFHNA5QJij9QChTtM3HJi415ZUDJxXwZdTiVSa6srEuZVXh"
        )
    );
    console.log("depo.publicKey",User.publicKey.toString());

    return User;
}



