import { JwtPayload } from "jsonwebtoken";
import { RefreshTokensService } from "../auth/refresh-tokens/refresh-tokens.service";
import { Dataloaders } from "../dataloader/dataloader.types";
import { User } from "../users/models/user.model";
import { UserPermissions } from "../users/user.types";
import { UsersService } from "../users/users.service";

export interface Context {
  claims: {
    accessTokenClaims: JwtPayload | null;
    refreshTokenClaims: JwtPayload | null;
  };
  loaders: Dataloaders;
  permissions: UserPermissions | null;
  refreshTokensService: RefreshTokensService;
  usersService: UsersService;
  user: User | null;
}
