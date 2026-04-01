import { useState, useEffect, useCallback } from 'react';
import { colors, s } from '../shared/styles';
import { fetchDownloadFiles, createDownloadFile, updateDownloadFile, deleteDownloadFile, uploadFile, triggerRebuild } from '../adminClient';

function DownloadManager() {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ displayName: '', category: 'product', order: 0, linkedProducts: [] as string[] });

  const categoryLabels: Record<string, string> = {
    product: '제품 소개서',
    company: '회사 소개서',
    catalog: '카탈로그',
    etc: '기타',
  };

  const productOptions = [
    { value: 'modern-picky', label: 'Modern Picky (모던피키)' },
    { value: 'classic-picky', label: 'Classic Picky (클래식피키)' },
    { value: 'urban-picky', label: 'Urban Picky (어반피키)' },
    { value: 'modern-mini-picky', label: 'Modern Mini Picky (모던미니피키)' },
    { value: 'urban-mini-picky', label: 'Urban Mini Picky (어반미니피키)' },
    { value: 'modern-retro-picky', label: 'Modern Retro Picky (모던레트로피키)' },
    { value: 'urban-retro-picky', label: 'Urban Retro Picky (어반레트로피키)' },
    { value: 'outdoor-picky', label: 'Outdoor Picky (아웃도어피키)' },
    { value: 'air-picky', label: 'Air Picky (에어피키)' },
  ];

  const load = useCallback(() => {
    setLoading(true);
    fetchDownloadFiles().then(setFiles).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const formatSize = (bytes: number) => {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!form.displayName.trim()) {
      alert('표시 이름을 먼저 입력해주세요.');
      return;
    }
    setUploading(true);
    try {
      const asset = await uploadFile(file);
      await createDownloadFile({
        displayName: form.displayName,
        category: form.category,
        isActive: true,
        order: form.order,
        linkedProducts: form.linkedProducts,
        file: { _type: 'file', asset: { _type: 'reference', _ref: asset._id } },
      });
      setForm({ displayName: '', category: 'product', order: 0, linkedProducts: [] });
      e.target.value = '';
      load();
      triggerRebuild();
      alert('파일이 등록되었습니다!');
    } catch (err: any) {
      alert('업로드 실패: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    try {
      await updateDownloadFile(id, { isActive: !current });
      load();
      triggerRebuild();
    } catch (e) {
      alert('상태 변경에 실패했습니다.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('이 파일을 삭제하시겠습니까?')) {
      try {
        await deleteDownloadFile(id);
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
        <h1 style={s.title}>다운로드 파일 관리</h1>
      </div>

      <div style={s.card}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>📄 새 파일 등록</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 80px auto', gap: 12, alignItems: 'end' }}>
          <div>
            <label style={s.label}>표시 이름</label>
            <input style={s.input} value={form.displayName} onChange={e => setForm(p => ({ ...p, displayName: e.target.value }))} placeholder="예: 레트로 피키 제품소개서" />
          </div>
          <div>
            <label style={s.label}>카테고리</label>
            <select style={s.input} value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
              <option value="product">제품 소개서</option>
              <option value="company">회사 소개서</option>
              <option value="catalog">카탈로그</option>
              <option value="etc">기타</option>
            </select>
          </div>
          <div>
            <label style={s.label}>순서</label>
            <input style={s.input} type="number" value={form.order} onChange={e => setForm(p => ({ ...p, order: parseInt(e.target.value) || 0 }))} />
          </div>
          <div>
            <label style={{ ...s.btn, ...s.btnPrimary, display: 'inline-block', cursor: uploading ? 'wait' : 'pointer', whiteSpace: 'nowrap' }}>
              {uploading ? '업로드 중...' : 'PDF 선택'}
              <input type="file" accept=".pdf" onChange={handleUpload} style={{ display: 'none' }} disabled={uploading} />
            </label>
          </div>
        </div>

        {form.category === 'product' && (
          <div style={{ marginTop: 16 }}>
            <label style={s.label}>연결 제품 (제품소개 페이지에서 해당 제품 선택 시 이 파일이 다운로드됩니다)</label>
            <select
              multiple
              style={{ ...s.input, height: 180 }}
              value={form.linkedProducts}
              onChange={e => {
                const selected = Array.from(e.target.selectedOptions, o => o.value);
                setForm(p => ({ ...p, linkedProducts: selected }));
              }}
            >
              {productOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <p style={{ fontSize: 11, color: colors.textLight, marginTop: 4 }}>Ctrl(Cmd) + 클릭으로 여러 제품을 선택할 수 있습니다</p>
          </div>
        )}
      </div>

      {loading ? <p style={{ color: colors.textLight, padding: 40 }}>로딩 중...</p> : (
        <div style={s.card}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={{ ...s.th, width: 40 }}>순서</th>
                <th style={s.th}>파일명</th>
                <th style={s.th}>카테고리</th>
                <th style={s.th}>용량</th>
                <th style={s.th}>상태</th>
                <th style={{ ...s.th, width: 180 }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {files.length === 0 && (
                <tr><td colSpan={6} style={{ ...s.td, textAlign: 'center', color: colors.textLight, padding: 40 }}>등록된 파일이 없습니다</td></tr>
              )}
              {files.map((file: any) => (
                <tr key={file._id}>
                  <td style={{ ...s.td, textAlign: 'center', color: colors.textLight }}>{file.order ?? 0}</td>
                  <td style={{ ...s.td, fontWeight: 600 }}>
                    {file.displayName}
                    {file.fileName && <div style={{ fontSize: 11, color: colors.textLight, marginTop: 2 }}>{file.fileName}</div>}
                    {file.linkedProducts?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                        {file.linkedProducts.map((p: string) => (
                          <span key={p} style={{ ...s.badge, background: '#e0f2fe', color: '#0369a1', fontSize: 10 }}>{p}</span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td style={s.td}>
                    <span style={{ ...s.badge, background: '#f0f0f0', color: colors.text }}>{categoryLabels[file.category] || file.category}</span>
                  </td>
                  <td style={{ ...s.td, fontSize: 12, color: colors.textLight }}>{formatSize(file.fileSize)}</td>
                  <td style={s.td}>
                    <span style={{ ...s.badge, background: file.isActive ? '#dcfce7' : '#fee2e2', color: file.isActive ? colors.green : colors.red }}>
                      {file.isActive ? '공개' : '비공개'}
                    </span>
                  </td>
                  <td style={s.td}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {file.fileUrl && (
                        <a href={file.fileUrl} target="_blank" rel="noopener" style={{ ...s.btn, ...s.btnOutline, padding: '4px 10px', fontSize: 11, textDecoration: 'none' }}>미리보기</a>
                      )}
                      <button onClick={() => toggleActive(file._id, file.isActive)} style={{ ...s.btn, ...s.btnOutline, padding: '4px 10px', fontSize: 11 }}>
                        {file.isActive ? '비공개' : '공개'}
                      </button>
                      <button onClick={() => handleDelete(file._id)} style={{ ...s.btn, ...s.btnDanger, padding: '4px 10px', fontSize: 11 }}>삭제</button>
                    </div>
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

export default DownloadManager;
