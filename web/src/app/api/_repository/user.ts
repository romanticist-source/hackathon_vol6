import { UserCreateInterface, UserUpdateInterface } from '@/app/schema/user';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();



/**
 * ユーザーをupsert（存在しない場合は作成、存在する場合は更新）
 * @param data upsertするユーザーデータ
 * @returns 作成または更新されたユーザー
 */
export async function upsertUser(data: UserCreateInterface) {
  try {
    const user = await prisma.user.upsert({
      where: {
        email: data.email,
      },
      update: {
        name: data.name,
        icon: data.icon || "",
        updatedAt: new Date(),
      },
      create: {
        email: data.email,
        name: data.name,
        icon: data.icon || "",
      },
    });
    
    return user;
  } catch (error) {
    console.error('ユーザーのupsertでエラーが発生しました:', error);
    throw new Error('ユーザーの作成または更新に失敗しました');
  }
}

/**
 * メールアドレスでユーザーを検索
 * @param email 検索するメールアドレス
 * @returns 見つかったユーザーまたはnull
 */
export async function findUserByEmail(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });
    
    return user;
  } catch (error) {
    console.error('ユーザーの検索でエラーが発生しました:', error);
    throw new Error('ユーザーの検索に失敗しました');
  }
}

/**
 * IDでユーザーを検索
 * @param id 検索するユーザーID
 * @returns 見つかったユーザーまたはnull
 */
export async function findUserById(id: string) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id,
      },
    });
    
    return user;
  } catch (error) {
    console.error('ユーザーの検索でエラーが発生しました:', error);
    throw new Error('ユーザーの検索に失敗しました');
  }
}

/**
 * ユーザーを更新
 * @param id 更新するユーザーのID
 * @param data 更新するデータ
 * @returns 更新されたユーザー
 */
export async function updateUser(id: string, data: UserUpdateInterface) {
  try {
    const user = await prisma.user.update({
      where: {
        id,
      },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
    
    return user;
  } catch (error) {
    console.error('ユーザーの更新でエラーが発生しました:', error);
    throw new Error('ユーザーの更新に失敗しました');
  }
}

/**
 * ユーザーを削除
 * @param id 削除するユーザーのID
 * @returns 削除されたユーザー
 */
export async function deleteUser(id: string) {
  try {
    const user = await prisma.user.delete({
      where: {
        id,
      },
    });
    
    return user;
  } catch (error) {
    console.error('ユーザーの削除でエラーが発生しました:', error);
    throw new Error('ユーザーの削除に失敗しました');
  }
}
