import { useState, useEffect, useCallback } from 'react';
import { colors, s } from '../shared/styles';
import { fetchPortfolioItems, deletePortfolioItem, triggerRebuild } from '../adminClient';

function PortfolioManager({ onNavigate }: { onNavigate: (page: string, id?: string) => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    fetchPortfolioItems().then(setItems).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`"${title}" 항목을 삭제하시겠습니까?`)) {
      try {
        await deletePortfolioItem(id);
        load();
        triggerRebuild();
      } catch (e) {
        alert('삭제에 실패했습니다.');
      }
    }
  };

  const filtered = filter ? items.filter(item => item.category === filter) : items;

  const categoryOptions = [
    { value: '', label: '전체' },
    { value: 'modern-picky', label: 'Modern Picky' },
    { value: 'classic-picky', label: 'Classic Picky' },
    { value: 'urban-picky', label: 'Urban Picky' },
    { value: 'modern-mini', label: 'Modern Mini' },
    { value: 'urban-mini', label: 'Urban Mini' },
    { value: 'modern-retro', label: 'Modern Retro' },
    { value: 'urban-retro', label: 'Urban Retro' },
    { value: 'outdoor', label: 'Outdoor Picky' },
    { value: 'air', label: 'Air Picky' },
  ];

  return (
    <div>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>포트폴리오 관리</h1>
          <span style={{ fontSize: 13, color: colors.textLight }}>총 {items.length}개</span>
        </div>
        <button onClick={() => onNavigate('portfolio-new')} style={{ ...s.btn, ...s.btnPrimary }}>
          + 새 포트폴리오
        </button>
      </div>

      {/* Filter */}
      <div style={{ ...s.card, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', padding: 16 }}>
        {categoryOptions.map(c => (
          <button
            key={c.value}
            onClick={() => setFilter(c.value)}
            style={{
              ...s.btn,
              padding: '6px 14px', fontSize: 12,
              background: filter === c.value ? colors.text : '#fff',
              color: filter === c.value ? '#fff' : colors.text,
              border: `1px solid ${filter === c.value ? colors.text : colors.border}`,
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <p style={{ color: colors.textLight, padding: 40, textAlign: 'center' }}>로딩 중...</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: colors.textLight, padding: 40, textAlign: 'center' }}>포트폴리오가 없습니다.</p>
      ) : (
        <div style={s.card}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>썸네일</th>
                <th style={s.th}>제목</th>
                <th style={s.th}>카테고리</th>
                <th style={s.th}>이미지</th>
                <th style={s.th}>본문</th>
                <th style={s.th}>순서</th>
                <th style={s.th}>표시</th>
                <th style={s.th}>관리</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item: any) => (
                <tr key={item._id} style={{ cursor: 'pointer' }} onClick={() => onNavigate('portfolio-edit', item._id)}>
                  <td style={s.td}>
                    {item.thumbnail?.asset?.url ? (
                      <img src={item.thumbnail.asset.url} alt={item.title} style={{ width: 60, height: 45, objectFit: 'cover', borderRadius: 4 }} />
                    ) : (
                      <div style={{ width: 60, height: 45, background: '#f0f0f0', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: colors.textLight }}>없음</div>
                    )}
                  </td>
                  <td style={{ ...s.td, fontWeight: 600, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.title}
                  </td>
                  <td style={s.td}>
                    <span style={{ ...s.badge, background: '#f0f0f0', fontSize: 11 }}>{item.category}</span>
                  </td>
                  <td style={s.td}>{item.imageCount || 0}장</td>
                  <td style={s.td}>
                    {item.hasBody ? (
                      <span style={{ ...s.badge, background: '#dcfce7', color: colors.green }}>있음</span>
                    ) : (
                      <span style={{ ...s.badge, background: '#f0f0f0', color: colors.textLight }}>없음</span>
                    )}
                  </td>
                  <td style={s.td}>{item.order}</td>
                  <td style={s.td}>
                    {item.isVisible ? (
                      <span style={{ color: colors.green }}>●</span>
                    ) : (
                      <span style={{ color: colors.textLight }}>○</span>
                    )}
                  </td>
                  <td style={s.td}>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(item._id, item.title); }}
                      style={{ fontSize: 11, color: colors.red, background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default PortfolioManager;
