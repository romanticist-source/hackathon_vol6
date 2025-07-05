import { UserCreateInterface, UserUpdateInterface, userCreateSchema, userUpdateSchema } from '@/app/schema/user';
import { upsertUser, findUserByEmail, findUserById, updateUser, deleteUser } from '@/app/api/_repository/user';
import { z } from 'zod';

/**
 * ユーザーをupsert（作成または更新）
 * @param data 作成または更新するユーザーデータ
 * @returns 作成または更新されたユーザー
 */
export async function upsertUserUsecase(data: UserCreateInterface) {
  // バリデーション
  const validatedData = userCreateSchema.parse(data);
  
  try {
    const user = await upsertUser(validatedData);
    return {
      success: true,
      data: user,
      message: 'ユーザーの作成または更新が成功しました'
    };
  } catch (error) {
    console.error('ユーザーのupsertでエラーが発生しました:', error);
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : 'ユーザーの作成または更新に失敗しました'
    };
  }
}

/**
 * メールアドレスでユーザーを検索
 * @param email 検索するメールアドレス
 * @returns 検索結果
 */
export async function findUserByEmailUsecase(email: string) {
  // バリデーション
  const emailSchema = z.string().email();
  
  try {
    const validatedEmail = emailSchema.parse(email);
    const user = await findUserByEmail(validatedEmail);
    
    return {
      success: true,
      data: user,
      message: user ? 'ユーザーが見つかりました' : 'ユーザーが見つかりませんでした'
    };
  } catch (error) {
    console.error('ユーザーの検索でエラーが発生しました:', error);
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : 'ユーザーの検索に失敗しました'
    };
  }
}

/**
 * IDでユーザーを検索
 * @param id 検索するユーザーID
 * @returns 検索結果
 */
export async function findUserByIdUsecase(id: string) {
  // バリデーション
  const idSchema = z.string().uuid();
  
  try {
    const validatedId = idSchema.parse(id);
    const user = await findUserById(validatedId);
    
    return {
      success: true,
      data: user,
      message: user ? 'ユーザーが見つかりました' : 'ユーザーが見つかりませんでした'
    };
  } catch (error) {
    console.error('ユーザーの検索でエラーが発生しました:', error);
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : 'ユーザーの検索に失敗しました'
    };
  }
}

/**
 * ユーザーを更新
 * @param id 更新するユーザーのID
 * @param data 更新するデータ
 * @returns 更新結果
 */
export async function updateUserUsecase(id: string, data: UserUpdateInterface) {
  // バリデーション
  const idSchema = z.string().uuid();
  const validatedId = idSchema.parse(id);
  const validatedData = userUpdateSchema.parse(data);
  
  try {
    // ユーザーが存在するかチェック
    const existingUser = await findUserById(validatedId);
    if (!existingUser) {
      return {
        success: false,
        data: null,
        message: '更新対象のユーザーが見つかりません'
      };
    }

    const updatedUser = await updateUser(validatedId, validatedData);
    return {
      success: true,
      data: updatedUser,
      message: 'ユーザーの更新が成功しました'
    };
  } catch (error) {
    console.error('ユーザーの更新でエラーが発生しました:', error);
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : 'ユーザーの更新に失敗しました'
    };
  }
}

/**
 * ユーザーを削除
 * @param id 削除するユーザーのID
 * @returns 削除結果
 */
export async function deleteUserUsecase(id: string) {
  // バリデーション
  const idSchema = z.string().uuid();
  
  try {
    const validatedId = idSchema.parse(id);
    
    // ユーザーが存在するかチェック
    const existingUser = await findUserById(validatedId);
    if (!existingUser) {
      return {
        success: false,
        data: null,
        message: '削除対象のユーザーが見つかりません'
      };
    }

    const deletedUser = await deleteUser(validatedId);
    return {
      success: true,
      data: deletedUser,
      message: 'ユーザーの削除が成功しました'
    };
  } catch (error) {
    console.error('ユーザーの削除でエラーが発生しました:', error);
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : 'ユーザーの削除に失敗しました'
    };
  }
} 