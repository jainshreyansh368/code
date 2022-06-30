import BN from 'bn.js';
import { Buffer } from 'buffer';

export const CurveType = Object.freeze({
    ConstantProduct: 0, // Constant product curve, Uniswap-style
    ConstantPrice: 1, // Constant price curve, always X amount of A token for 1 B token, where X is defined at init
    Offset: 3, // Offset curve, like Uniswap, but with an additional offset on the token B side
});

export class Numberu64 extends BN {
    /**
     * Convert to Buffer representation
     */
    toBuffer(): Buffer {
        const a = super.toArray().reverse();
        const b = Buffer.from(a);
        if (b.length === 8) {
            return b;
        }

        const zeroPad = Buffer.alloc(8);
        b.copy(zeroPad);
        return zeroPad;
    }

    /**
     * Construct a Numberu64 from Buffer representation
     */
    static fromBuffer(buffer: Buffer): Numberu64 {
        return new Numberu64(
            // @ts-ignore
            [...buffer]
                .reverse()
                .map(i => `00${i.toString(16)}`.slice(-2))
                .join(''),
            16,
        );
    }
}