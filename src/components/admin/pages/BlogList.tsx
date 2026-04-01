import { useState, useEffect, useCallback } from 'react';
import { colors, s } from '../shared/styles';
import { fetchBlogPosts, deleteBlogPost, triggerRebuild } from '../adminClient';

export default function BlogList({ onNavigate }: { onNavigate: (page: string, id?: string) => void }) {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetchBlogPosts().then(setPosts).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`"${title}" 글을 삭제하시겠습니까?`)) {
      try {
        await deleteBlogPost(id);
        load();
        triggerRebuild();
      } catch (e) {
        alert('삭제에 실패했습니다.');
      }
    }
  };

  return (
    <div>
      <div style={s.header}>
        <h1 style={s.title}>글 관리</h1>
        <button onClick={() => onNavigate('blog-new')} style={{ ...s.btn, ...s.btnPrimary }}>+ 새 글 작성</button>
      </div>
      <div style={s.card}>
        {loading ? <p style={{ textAlign: 'center', color: colors.textLight, padding: 40 }}>로딩 중...</p> : (
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>제목</th>
                <th style={s.th}>카테고리</th>
                <th style={s.th}>상태</th>
                <th style={s.th}>작성일</th>
                <th style={s.th}>관리</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post: any) => (
                <tr key={post._id} style={{ cursor: 'pointer' }} onClick={() => onNavigate('blog-edit', post._id)}>
                  <td style={{ ...s.td, fontWeight: 600 }}>{post.title}</td>
                  <td style={s.td}><span style={{ ...s.badge, background: '#f0f0f0' }}>{post.category?.title || '-'}</span></td>
                  <td style={s.td}>
                    <span style={{ ...s.badge, background: post.publishedAt ? '#dcfce7' : '#fef9c3', color: post.publishedAt ? colors.green : colors.orange }}>
                      {post.publishedAt ? '발행됨' : '임시저장'}
                    </span>
                  </td>
                  <td style={{ ...s.td, fontSize: 12, color: colors.textLight }}>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('ko') : '-'}</td>
                  <td style={{ ...s.td, display: 'flex', gap: 4 }}>
                    <button onClick={(e) => { e.stopPropagation(); onNavigate('blog-edit', post._id); }} style={{ ...s.btn, ...s.btnOutline, padding: '4px 10px', fontSize: 11 }}>수정</button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(post._id, post.title); }} style={{ ...s.btn, ...s.btnDanger, padding: '4px 10px', fontSize: 11 }}>삭제</button>
                  </td>
                </tr>
              ))}
              {posts.length === 0 && <tr><td colSpan={5} style={{ ...s.td, textAlign: 'center', color: colors.textLight, padding: 40 }}>글이 없습니다. 새 글을 작성해보세요!</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
