import { useState, useCallback, useEffect } from 'react';
import { colors, s } from '../shared/styles';
import { fetchInquiries, updateInquiry, deleteInquiry } from '../adminClient';

function InquiryManager() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState<any>(null);
  const [memo, setMemo] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    fetchInquiries().then(setItems).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateInquiry(id, { status });
      load();
    } catch (e) {
      alert('상태 변경에 실패했습니다.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`"${name}" 문의를 삭제하시겠습니까?`)) {
      try {
        await deleteInquiry(id);
        if (detail?._id === id) setDetail(null);
        load();
      } catch (e) {
        alert('삭제에 실패했습니다.');
      }
    }
  };

  const handleMemoSave = async (id: string) => {
    try {
      await updateInquiry(id, { memo });
      alert('메모가 저장되었습니다.');
      load();
    } catch (e) {
      alert('메모 저장에 실패했습니다.');
    }
  };

  const getFiltered = () => {
    let filtered = items;
    if (filter !== 'all') filtered = filtered.filter((i: any) => i.status === filter);
    if (search) filtered = filtered.filter((i: any) =>
      [i.name, i.inquiryType, i.phone, i.email, i.company, i.eventName]
        .some(v => v?.toLowerCase().includes(search.toLowerCase()))
    );
    return filtered;
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; color: string; label: string }> = {
      '대기': { bg: '#fef9c3', color: colors.orange, label: '대기' },
      '확인': { bg: '#dbeafe', color: colors.blue, label: '확인' },
      '답변완료': { bg: '#dcfce7', color: colors.green, label: '답변완료' },
      '보류': { bg: '#f3f4f6', color: '#6b7280', label: '보류' },
    };
    const st = map[status] || map['대기'];
    return <span style={{ ...s.badge, background: st.bg, color: st.color }}>{st.label}</span>;
  };

  const filtered = getFiltered();
  const counts = {
    all: items.length,
    '대기': items.filter((i: any) => i.status === '대기').length,
    '확인': items.filter((i: any) => i.status === '확인').length,
    '답변완료': items.filter((i: any) => i.status === '답변완료').length,
    '보류': items.filter((i: any) => i.status === '보류').length,
  };

  return (
    <div>
      <div style={s.header}>
        <h1 style={s.title}>문의 관리</h1>
      </div>

      {/* Status Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(80px, 1fr))', gap: 8, marginBottom: 16 }}>
        {[
          { key: 'all', label: '전체', count: counts.all, color: colors.text },
          { key: '대기', label: '대기', count: counts['대기'], color: colors.orange },
          { key: '확인', label: '확인', count: counts['확인'], color: colors.blue },
          { key: '답변완료', label: '답변완료', count: counts['답변완료'], color: colors.green },
          { key: '보류', label: '보류', count: counts['보류'], color: '#6b7280' },
        ].map(item => (
          <div key={item.key} style={{ ...s.statCard, padding: '12px 8px', cursor: 'pointer', border: filter === item.key ? `2px solid ${item.color}` : `1px solid ${colors.border}` }} onClick={() => setFilter(item.key)}>
            <div style={{ fontSize: 11, color: colors.textLight, marginBottom: 2 }}>{item.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: item.color }}>{item.count}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input style={{ ...s.input, width: 300 }} value={search} onChange={e => setSearch(e.target.value)} placeholder="검색 (이름, 유형, 연락처, 이메일...)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: detail ? '1fr 400px' : '1fr', gap: 16 }}>
        {/* Table */}
        <div style={s.card}>
          {loading ? <p style={{ textAlign: 'center', color: colors.textLight, padding: 40 }}>로딩 중...</p> : (
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>상태</th>
                  <th style={s.th}>문의유형</th>
                  <th style={s.th}>이름</th>
                  <th style={s.th}>연락처</th>
                  <th style={s.th}>이메일</th>
                  <th style={s.th}>제출일</th>
                  <th style={s.th}>관리</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item: any) => (
                  <tr key={item._id} style={{ cursor: 'pointer', background: detail?._id === item._id ? '#fef9e7' : 'transparent' }} onClick={() => { setDetail(item); setMemo(item.memo || ''); }}>
                    <td style={s.td}>{statusBadge(item.status)}</td>
                    <td style={{ ...s.td, fontSize: 12 }}>{item.inquiryType || '-'}</td>
                    <td style={{ ...s.td, fontWeight: 600 }}>{item.name || '-'}</td>
                    <td style={{ ...s.td, fontSize: 12 }}>{item.phone || '-'}</td>
                    <td style={{ ...s.td, fontSize: 12, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.email || '-'}</td>
                    <td style={{ ...s.td, fontSize: 11, color: colors.textLight }}>{item.submittedAt ? new Date(item.submittedAt).toLocaleDateString('ko') : '-'}</td>
                    <td style={s.td}>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(item._id, item.name || '무명'); }} style={{ fontSize: 11, color: colors.red, background: 'none', border: 'none', cursor: 'pointer' }}>삭제</button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={7} style={{ ...s.td, textAlign: 'center', color: colors.textLight, padding: 40 }}>문의가 없습니다</td></tr>}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail Panel */}
        {detail && (
          <div style={{ ...s.card, position: 'sticky', top: 24, alignSelf: 'start', maxHeight: 'calc(100vh - 80px)', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700 }}>상세 정보</h3>
              <button onClick={() => setDetail(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>

            {/* Status Change */}
            <div style={{ marginBottom: 16 }}>
              <label style={s.label}>상태 변경</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[
                  { value: '대기', label: '대기' },
                  { value: '확인', label: '확인' },
                  { value: '답변완료', label: '답변완료' },
                  { value: '보류', label: '보류' },
                ].map(st => (
                  <button key={st.value} onClick={() => { handleStatusChange(detail._id, st.value); setDetail({ ...detail, status: st.value }); }}
                    style={{ ...s.btn, ...(detail.status === st.value ? s.btnPrimary : s.btnOutline), padding: '4px 12px', fontSize: 11 }}>
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Info Fields */}
            {[
              { label: '문의 유형', value: detail.inquiryType },
              { label: '이름', value: detail.name },
              { label: '연락처', value: detail.phone },
              { label: '이메일', value: detail.email },
              { label: '회사명', value: detail.company },
              { label: '행사명', value: detail.eventName },
              { label: '행사 일자', value: detail.eventDate },
              { label: '언어', value: detail.language },
              { label: '제출일', value: detail.submittedAt ? new Date(detail.submittedAt).toLocaleString('ko') : '-' },
            ].map((field, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: colors.textLight, fontWeight: 600 }}>{field.label}</span>
                <p style={{ fontSize: 13, color: colors.text, marginTop: 2, wordBreak: 'break-all' }}>{field.value || '-'}</p>
              </div>
            ))}

            {/* Message */}
            <div style={{ marginBottom: 8, padding: 12, background: '#f9fafb', borderRadius: 8 }}>
              <span style={{ fontSize: 11, color: colors.textLight, fontWeight: 600 }}>문의 내용</span>
              <p style={{ fontSize: 13, color: colors.text, marginTop: 4, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{detail.message || '-'}</p>
            </div>

            {/* Memo */}
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${colors.border}` }}>
              <label style={s.label}>관리자 메모</label>
              <textarea style={{ ...s.textarea, minHeight: 80 }} value={memo} onChange={e => setMemo(e.target.value)} placeholder="내부 메모를 작성하세요" />
              <button onClick={() => handleMemoSave(detail._id)} style={{ ...s.btn, ...s.btnPrimary, marginTop: 8, width: '100%' }}>메모 저장</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default InquiryManager;
