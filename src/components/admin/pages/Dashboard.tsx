import { useState, useEffect } from 'react';
import { colors, s } from '../shared/styles';
import { fetchDashboardStats, fetchBlogPosts } from '../adminClient';

export default function Dashboard({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [stats, setStats] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardStats().then(setStats).catch(() => {});
    fetchBlogPosts().then(setPosts).catch(() => {});
  }, []);

  return (
    <div>
      <div style={s.header}>
        <h1 style={s.title}>대시보드</h1>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(120px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { icon: '📄', label: '전체 글', value: stats?.totalPosts ?? '-', color: colors.text },
          { icon: '✅', label: '발행됨', value: stats?.published ?? '-', color: colors.green },
          { icon: '📝', label: '임시저장', value: stats?.drafts ?? '-', color: colors.orange },
          { icon: '📸', label: '포트폴리오', value: stats?.portfolioCount ?? '-', color: colors.blue },
        ].map((item, i) => (
          <div key={i} style={s.statCard}>
            <div style={{ fontSize: 22, marginBottom: 2 }}>{item.icon}</div>
            <div style={{ fontSize: 11, color: colors.textLight, marginBottom: 2, whiteSpace: 'nowrap' }}>{item.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: item.color }}>{item.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(240px, 1fr)', gap: 12 }}>
        {/* Recent Posts */}
        <div style={s.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>최근 수정된 글</h2>
            <button onClick={() => onNavigate('blogs')} style={{ ...s.btn, ...s.btnOutline, padding: '6px 14px', fontSize: 12 }}>전체 보기 →</button>
          </div>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>제목</th>
                <th style={s.th}>카테고리</th>
                <th style={s.th}>상태</th>
                <th style={s.th}>수정일</th>
              </tr>
            </thead>
            <tbody>
              {posts.slice(0, 5).map((post: any) => (
                <tr key={post._id}>
                  <td style={{ ...s.td, fontWeight: 500, maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.title}</td>
                  <td style={s.td}><span style={{ ...s.badge, background: '#f0f0f0', color: colors.textLight }}>{post.category?.title || '-'}</span></td>
                  <td style={s.td}>
                    <span style={{ ...s.badge, background: post.publishedAt ? '#dcfce7' : '#fef9c3', color: post.publishedAt ? colors.green : colors.orange }}>
                      {post.publishedAt ? '발행됨' : '임시저장'}
                    </span>
                  </td>
                  <td style={{ ...s.td, color: colors.textLight, fontSize: 12 }}>
                    {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('ko') : '-'}
                  </td>
                </tr>
              ))}
              {posts.length === 0 && <tr><td colSpan={4} style={{ ...s.td, textAlign: 'center', color: colors.textLight }}>글이 없습니다</td></tr>}
            </tbody>
          </table>
        </div>

        {/* Quick Actions + Categories */}
        <div>
          <div style={s.card}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>바로가기</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: '+ 새 글 작성', page: 'blog-new' },
                { label: '📁 카테고리', page: 'categories' },
                { label: '📸 포트폴리오', page: 'portfolio' },
                { label: '❓ FAQ 관리', page: 'faq' },
              ].map((item, i) => (
                <button key={i} onClick={() => onNavigate(item.page)} style={{ ...s.btn, ...s.btnOutline, fontSize: 12, padding: '12px 8px', whiteSpace: 'nowrap' }}>{item.label}</button>
              ))}
            </div>
          </div>
          <div style={s.card}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>카테고리별 글 수</h2>
            {stats?.categories?.map((cat: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < stats.categories.length - 1 ? `1px solid ${colors.border}` : 'none', fontSize: 13 }}>
                <span>{cat.title}</span>
                <span style={{ fontWeight: 700 }}>{cat.count}개</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
