import { useState, useEffect } from 'react';
import { colors, s } from '../shared/styles';
import { fetchCategories } from '../adminClient';

function CategoryManager() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchCategories().then(setCategories).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={s.header}><h1 style={s.title}>카테고리 관리</h1></div>
      <div style={s.card}>
        {loading ? <p style={{ color: colors.textLight }}>로딩 중...</p> : (
          <table style={s.table}>
            <thead><tr><th style={s.th}>카테고리</th><th style={s.th}>글 수</th></tr></thead>
            <tbody>
              {categories.map((cat: any) => (
                <tr key={cat._id}>
                  <td style={{ ...s.td, fontWeight: 600 }}>{cat.title}</td>
                  <td style={s.td}>{cat.postCount}개</td>
                </tr>
              ))}
              {categories.length === 0 && <tr><td colSpan={2} style={{ ...s.td, textAlign: 'center', color: colors.textLight }}>카테고리가 없습니다</td></tr>}
            </tbody>
          </table>
        )}
        <p style={{ fontSize: 11, color: colors.textLight, marginTop: 12 }}>* 카테고리 추가/삭제는 Sanity Studio(sanity.io)에서 관리할 수 있습니다.</p>
      </div>
    </div>
  );
}

export default CategoryManager;
