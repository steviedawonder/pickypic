import { useState, useCallback, useEffect } from 'react';
import { colors, s } from '../shared/styles';
import { fetchCollaborationRequests, updateCollaborationRequest, deleteCollaborationRequest } from '../adminClient';

function CollaborationManager() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState<any>(null);
  const [memo, setMemo] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    fetchCollaborationRequests().then(setItems).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (id: string, status: string) => {
    await updateCollaborationRequest(id, { status });
    load();
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`"${name}" 협업 신청을 삭제하시겠습니까?`)) {
      await deleteCollaborationRequest(id);
      if (detail?._id === id) setDetail(null);
      load();
    }
  };

  const handleMemoSave = async (id: string) => {
    await updateCollaborationRequest(id, { memo });
    alert('메모가 저장되었습니다.');
    load();
  };

  const exportExcel = () => {
    const filtered = getFiltered();
    const headers = ['신청일', '상태', '협업형태', '행사명', '사업자명', '담당자', '연락처', '이메일', '설치장소', '행사일정', '철거일정', '부스타입', '래핑', '촬영타입', '기타문의'];
    const rows = filtered.map((item: any) => [
      item.submittedAt ? new Date(item.submittedAt).toLocaleDateString('ko') : '-',
      item.status === 'pending' ? '대기' : item.status === 'in_progress' ? '진행중' : '완료',
      item.collaborationType || '', item.eventName || '', item.companyName || '',
      item.contactName || '', item.contactPhone || '', item.contactEmail || '',
      item.installLocation || '', item.eventSchedule || '', item.removalSchedule || '',
      item.boothType || '', item.wrapping || '', item.shootingType || '',
      item.additionalMessage || '',
    ]);
    const csv = '\uFEFF' + [headers, ...rows].map(r => r.map((c: string) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `협업신청_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getFiltered = () => {
    let filtered = items;
    if (filter !== 'all') filtered = filtered.filter((i: any) => i.status === filter);
    if (search) filtered = filtered.filter((i: any) =>
      [i.eventName, i.companyName, i.contactName, i.contactEmail, i.contactPhone]
        .some(v => v?.toLowerCase().includes(search.toLowerCase()))
    );
    return filtered;
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; color: string; label: string }> = {
      pending: { bg: '#fef9c3', color: colors.orange, label: '대기' },
      in_progress: { bg: '#dbeafe', color: colors.blue, label: '진행중' },
      completed: { bg: '#dcfce7', color: colors.green, label: '완료' },
    };
    const st = map[status] || map.pending;
    return <span style={{ ...s.badge, background: st.bg, color: st.color }}>{st.label}</span>;
  };

  const filtered = getFiltered();
  const counts = {
    all: items.length,
    pending: items.filter((i: any) => i.status === 'pending').length,
    in_progress: items.filter((i: any) => i.status === 'in_progress').length,
    completed: items.filter((i: any) => i.status === 'completed').length,
  };

  return (
    <div>
      <div style={s.header}>
        <h1 style={s.title}>협업신청 관리</h1>
        <button onClick={exportExcel} style={{ ...s.btn, ...s.btnPrimary }}>📥 엑셀 다운로드</button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[
          { key: 'all', label: '전체' },
          { key: 'pending', label: '대기' },
          { key: 'in_progress', label: '진행중' },
          { key: 'completed', label: '완료' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            style={{ ...s.btn, ...(filter === f.key ? s.btnPrimary : s.btnOutline), padding: '6px 14px', fontSize: 12 }}>
            {f.label} ({counts[f.key as keyof typeof counts]})
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <input style={{ ...s.input, width: 240 }} value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 검색 (행사명, 사업자명, 담당자...)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: detail ? '1fr 400px' : '1fr', gap: 16 }}>
        {/* Table */}
        <div style={s.card}>
          {loading ? <p style={{ textAlign: 'center', color: colors.textLight, padding: 40 }}>로딩 중...</p> : (
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>상태</th>
                  <th style={s.th}>협업형태</th>
                  <th style={s.th}>행사명</th>
                  <th style={s.th}>사업자명</th>
                  <th style={s.th}>담당자</th>
                  <th style={s.th}>연락처</th>
                  <th style={s.th}>신청일</th>
                  <th style={s.th}>관리</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item: any) => (
                  <tr key={item._id} style={{ cursor: 'pointer', background: detail?._id === item._id ? '#fef9e7' : 'transparent' }} onClick={() => { setDetail(item); setMemo(item.memo || ''); }}>
                    <td style={s.td}>{statusBadge(item.status)}</td>
                    <td style={{ ...s.td, fontSize: 12 }}>{item.collaborationType || '-'}</td>
                    <td style={{ ...s.td, fontWeight: 600, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.eventName || '-'}</td>
                    <td style={{ ...s.td, fontSize: 12 }}>{item.companyName || '-'}</td>
                    <td style={{ ...s.td, fontSize: 12 }}>{item.contactName || '-'}</td>
                    <td style={{ ...s.td, fontSize: 12 }}>{item.contactPhone || '-'}</td>
                    <td style={{ ...s.td, fontSize: 11, color: colors.textLight }}>{item.submittedAt ? new Date(item.submittedAt).toLocaleDateString('ko') : '-'}</td>
                    <td style={s.td}>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(item._id, item.eventName || item.companyName); }} style={{ fontSize: 11, color: colors.red, background: 'none', border: 'none', cursor: 'pointer' }}>삭제</button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={8} style={{ ...s.td, textAlign: 'center', color: colors.textLight, padding: 40 }}>협업 신청이 없습니다</td></tr>}
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
              <div style={{ display: 'flex', gap: 6 }}>
                {[
                  { value: 'pending', label: '대기' },
                  { value: 'in_progress', label: '진행중' },
                  { value: 'completed', label: '완료' },
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
              { label: '협업 형태', value: detail.collaborationType },
              { label: '행사명', value: detail.eventName },
              { label: '사업자명', value: detail.companyName },
              { label: '담당자', value: detail.contactName },
              { label: '연락처', value: detail.contactPhone },
              { label: '이메일', value: detail.contactEmail },
              { label: '설치 장소', value: detail.installLocation },
              { label: '행사 일정', value: detail.eventSchedule },
              { label: '철거 일정', value: detail.removalSchedule },
              { label: '부스 타입', value: detail.boothType },
              { label: '래핑', value: detail.wrapping },
              { label: '촬영 타입', value: detail.shootingType },
              { label: '기타 문의', value: detail.additionalMessage },
              { label: '신청일', value: detail.submittedAt ? new Date(detail.submittedAt).toLocaleString('ko') : '-' },
            ].map((field, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: colors.textLight, fontWeight: 600 }}>{field.label}</span>
                <p style={{ fontSize: 13, color: colors.text, marginTop: 2, wordBreak: 'break-all' }}>{field.value || '-'}</p>
              </div>
            ))}

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

export default CollaborationManager;
