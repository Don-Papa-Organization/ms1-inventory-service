import { JwtUserPayload } from "../interfaces/jwtUserPayloadI";

declare global {
  namespace Express {
    interface Request {
      user?: JwtUserPayload;
      file?: Express.Multer.File;
      files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
    }
  }
}

export {}; // Esto hace que el archivo sea un módulo

export enum TipoUsuario {
    cliente = 'cliente', 
    empleado = 'empleado',
    administrador = 'administrador' 
}
