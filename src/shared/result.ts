export type C_Result = C_Error | C_Success;

interface I_Result {
    output(): string;
}

export class C_Error implements I_Result {
    constructor(private res: string) {

    }

    output(): string {
        return this.res;
    }
}
export class C_Success implements I_Result {
    constructor(private res: string) {

    }

    output(): string {
        return this.res;
    }
}