import { AccountLayout, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token"
import { Keypair, PublicKey, SystemProgram,sendAndConfirmTransaction,Transaction, TransactionInstruction } from '@solana/web3.js';

export const createWrappedNativeAccount = async(
    connection:any,
    owner:Keypair,
    amount:number,
  ) => {
    // Allocate memory for the account
    const balanceNeeded = await Token.getMinBalanceRentForExemptAccount(
      connection,
    );

    const NATIVE_MINT = new PublicKey("So11111111111111111111111111111111111111112")

    // Create a new account
    const newAccount = Keypair.generate();
    
    const createIx = SystemProgram.createAccount({
        fromPubkey: owner.publicKey,
        newAccountPubkey: newAccount.publicKey,
        lamports: balanceNeeded,
        space: AccountLayout.span,
        programId: TOKEN_PROGRAM_ID
        
      });
    

    // Send lamports to it (these will be wrapped into native tokens by the token program)
    
    const transferIx = SystemProgram.transfer({
        fromPubkey: owner.publicKey,
        toPubkey: newAccount.publicKey,
        lamports: amount,
      });
    

    // Assign the new account to the native token mint.
    // the account will be initialized with a balance equal to the native token balance.
    // (i.e. amount)
    
    const initIx = Token.createInitAccountInstruction(
        TOKEN_PROGRAM_ID,
        NATIVE_MINT,
        newAccount.publicKey,
        owner.publicKey,
      );

    // Send the three instructions
    // await sendTxUsingExternalSignature(
    //   [createIx,
    //     transferIx,
    //     initIx],
    //   connection,
    //   null,
    //   [newAccount],
    //   owner,
    // );
    let transaction = new Transaction();

    transaction.add(
        createIx,transferIx,initIx
    );



    const tx = await sendAndConfirmTransaction(
        connection,
        transaction,
        [owner,newAccount]
    );

    console.log(newAccount.publicKey.toString(), "******new account")
    console.log(tx)


    // await sendAndConfirmTransaction(
    //   'createAccount, transfer, and initializeAccount',
    //   connection,
    //   transaction,
    //   payer,
    //   newAccount,
    // );

  }