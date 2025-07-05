import { NextRequest, NextResponse } from 'next/server';
import { 
  upsertUserUsecase, 
  findUserByEmailUsecase, 
  findUserByIdUsecase, 
  updateUserUsecase, 
  deleteUserUsecase 
} from '@/app/api/_usecase/user';
import { UserCreateInterface, UserUpdateInterface } from '@/app/schema/user';

/**
 * ユーザー一覧取得またはメール検索
 * GET /api/users?email=xxx (メール検索)
 * GET /api/users?id=xxx (ID検索)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const id = searchParams.get('id');

    if (email) {
      // メールアドレスでユーザー検索
      const result = await findUserByEmailUsecase(email);
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.message },
          { status: 400 }
        );
      }

      return NextResponse.json({
        message: result.message,
        user: result.data
      });
    }

    if (id) {
      // IDでユーザー検索
      const result = await findUserByIdUsecase(id);
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.message },
          { status: 400 }
        );
      }

      return NextResponse.json({
        message: result.message,
        user: result.data
      });
    }

    return NextResponse.json(
      { error: 'emailまたはidパラメータが必要です' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('ユーザー検索APIでエラーが発生しました:', error);
    return NextResponse.json(
      { error: 'ユーザー検索に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * ユーザー作成（upsert）
 * POST /api/users
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userData: UserCreateInterface = body;

    const result = await upsertUserUsecase(userData);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: result.message,
      user: result.data
    }, { status: 201 });

  } catch (error) {
    console.error('ユーザー作成APIでエラーが発生しました:', error);
    return NextResponse.json(
      { error: 'ユーザー作成に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * ユーザー更新
 * PUT /api/users?id=xxx
 */
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'idパラメータが必要です' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updateData: UserUpdateInterface = body;

    const result = await updateUserUsecase(id, updateData);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: result.message,
      user: result.data
    });

  } catch (error) {
    console.error('ユーザー更新APIでエラーが発生しました:', error);
    return NextResponse.json(
      { error: 'ユーザー更新に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * ユーザー削除
 * DELETE /api/users?id=xxx
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'idパラメータが必要です' },
        { status: 400 }
      );
    }

    const result = await deleteUserUsecase(id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: result.message,
      user: result.data
    });

  } catch (error) {
    console.error('ユーザー削除APIでエラーが発生しました:', error);
    return NextResponse.json(
      { error: 'ユーザー削除に失敗しました' },
      { status: 500 }
    );
  }
}
