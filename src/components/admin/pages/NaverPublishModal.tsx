import { useRef, useState } from 'react';
import { colors, s } from '../shared/styles';
import { ScoreCategoryPanel, ScoreCircle } from '../shared/SeoComponents';

interface NaverPublishModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (publish: boolean) => void;
  saving: boolean;
  form: {
    title: string;
    excerpt: string;
    body: string;
    focusKeyword: string;
    seoTitle: string;
    seoDescription: string;
    categoryId: string;
    tags: string[];
    tagInput: string;
    publishedAt: string;
  };
  updateField: (field: string, value: any) => void;
  categories: any[];
  allTags: any[];
  templates: any[];
  mainImageUrl: string;
  mainImageUploading: boolean;
  onMainImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
  onApplyTemplate: (template: any) => void;
  onSaveTemplate: () => void;
  onDeleteTemplate: (id: string) => void;
  scores: {
    seoScore: number;
    geoScore: number;
    totalScore: number;
    seoCategories: any[];
    geoCategories: any[];
  };
  slug: string;
}

const sectionTitle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  marginBottom: 12,
  color: colors.text,
};

const divider: React.CSSProperties = {
  borderTop: '1px solid #e8e8e8',
  margin: '20px 0',
};

const tagChip: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  background: '#f0f0f0',
  borderRadius: 20,
  fontSize: 11,
  fontWeight: 500,
  padding: '4px 10px',
  color: colors.text,
};

const tagSuggestion: React.CSSProperties = {
  display: 'inline-block',
  background: '#fff',
  border: '1px solid #e8e8e8',
  borderRadius: 20,
  fontSize: 11,
  padding: '4px 10px',
  cursor: 'pointer',
  color: colors.textLight,
};

export default function NaverPublishModal({
  open,
  onClose,
  onSave,
  saving,
  form,
  updateField,
  categories,
  allTags,
  templates,
  mainImageUrl,
  mainImageUploading,
  onMainImageUpload,
  onAddTag,
  onRemoveTag,
  onApplyTemplate,
  onSaveTemplate,
  onDeleteTemplate,
  scores,
  slug,
}: NaverPublishModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');

  if (!open) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onAddTag();
    }
  };

  const availableSuggestions = allTags.filter(
    (t: any) => !form.tags.includes(typeof t === 'string' ? t : t.title || t.name)
  );

  const getTagLabel = (t: any): string => (typeof t === 'string' ? t : t.title || t.name || '');

  const seoTitleLen = (form.seoTitle || '').length;
  const seoDescLen = (form.seoDescription || '').length;

  const previewTitle = form.seoTitle || form.title || '제목 없음';
  const previewDesc = form.seoDescription || form.excerpt || '설명이 여기에 표시됩니다.';
  const previewUrl = `picky-pic.com/blog/${slug || 'post-url'}`;

  return (
    <div
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          width: '100%',
          maxWidth: 600,
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Pretendard", sans-serif',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px 16px',
            borderBottom: '1px solid #e8e8e8',
            position: 'sticky',
            top: 0,
            background: '#fff',
            borderRadius: '16px 16px 0 0',
            zIndex: 1,
          }}
        >
          <span style={{ fontSize: 18, fontWeight: 800, color: colors.text }}>발행 설정</span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 22,
              cursor: 'pointer',
              color: colors.textLight,
              lineHeight: 1,
              padding: 4,
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px' }}>
          {/* 1. 카테고리 */}
          <div>
            <div style={sectionTitle}>카테고리</div>
            <select
              value={form.categoryId}
              onChange={(e) => updateField('categoryId', e.target.value)}
              style={{ ...s.input, cursor: 'pointer' }}
            >
              <option value="">카테고리 선택</option>
              {categories.map((cat: any) => (
                <option key={cat._id || cat.id} value={cat._id || cat.id}>
                  {cat.title || cat.name}
                </option>
              ))}
            </select>
          </div>

          <div style={divider} />

          {/* 2. 태그 */}
          <div>
            <div style={sectionTitle}>태그</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                type="text"
                value={form.tagInput}
                onChange={(e) => updateField('tagInput', e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="태그 입력 후 Enter"
                style={{ ...s.input, flex: 1 }}
              />
              <button
                onClick={onAddTag}
                style={{ ...s.btn, ...s.btnOutline, whiteSpace: 'nowrap' }}
              >
                추가
              </button>
            </div>
            {form.tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {form.tags.map((tag, idx) => (
                  <span key={`${tag}-${idx}`} style={tagChip}>
                    #{tag}
                    <button
                      onClick={() => onRemoveTag(tag)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 12,
                        color: colors.textLight,
                        padding: 0,
                        lineHeight: 1,
                      }}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
            {availableSuggestions.length > 0 && (
              <div>
                <div style={{ fontSize: 11, color: colors.textLight, marginBottom: 6 }}>추천 태그</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {availableSuggestions.slice(0, 12).map((t: any, idx: number) => {
                    const label = getTagLabel(t);
                    return (
                      <button
                        key={`${label}-${idx}`}
                        onClick={() => {
                          updateField('tags', [...form.tags, label]);
                        }}
                        style={tagSuggestion}
                      >
                        +{label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div style={divider} />

          {/* 3. 대표 이미지 */}
          <div>
            <div style={sectionTitle}>대표 이미지</div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onMainImageUpload}
              style={{ display: 'none' }}
            />
            {mainImageUrl ? (
              <div style={{ position: 'relative' }}>
                <img
                  src={mainImageUrl}
                  alt="대표 이미지"
                  style={{
                    width: '100%',
                    maxHeight: 200,
                    objectFit: 'cover',
                    borderRadius: 8,
                    border: '1px solid #e8e8e8',
                  }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    ...s.btn,
                    ...s.btnOutline,
                    position: 'absolute',
                    bottom: 8,
                    right: 8,
                    fontSize: 11,
                    padding: '6px 12px',
                  }}
                >
                  변경
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed #e8e8e8',
                  borderRadius: 8,
                  padding: 24,
                  textAlign: 'center',
                  cursor: 'pointer',
                  color: colors.textLight,
                  fontSize: 13,
                }}
              >
                {mainImageUploading ? (
                  <span>업로드 중...</span>
                ) : (
                  <>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>+</div>
                    <div>클릭하여 대표 이미지 업로드</div>
                  </>
                )}
              </div>
            )}
          </div>

          <div style={divider} />

          {/* 4. 공개 설정 */}
          <div>
            <div style={sectionTitle}>공개 설정</div>
            <div style={{ display: 'flex', gap: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                <input
                  type="radio"
                  name="visibility"
                  checked={visibility === 'public'}
                  onChange={() => setVisibility('public')}
                />
                공개
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                <input
                  type="radio"
                  name="visibility"
                  checked={visibility === 'private'}
                  onChange={() => setVisibility('private')}
                />
                비공개
              </label>
            </div>
          </div>

          <div style={divider} />

          {/* 5. 예약 발행 */}
          <div>
            <div style={sectionTitle}>예약 발행</div>
            <input
              type="datetime-local"
              value={form.publishedAt}
              onChange={(e) => updateField('publishedAt', e.target.value)}
              style={s.input}
            />
          </div>

          <div style={divider} />

          {/* 6. SEO 설정 */}
          <div>
            <div style={sectionTitle}>SEO 설정</div>
            <div style={{ marginBottom: 12 }}>
              <label style={s.label}>포커스 키워드</label>
              <input
                type="text"
                value={form.focusKeyword}
                onChange={(e) => updateField('focusKeyword', e.target.value)}
                placeholder="예: 제품 촬영"
                style={s.input}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={s.label}>
                SEO 제목
                <span style={{ fontWeight: 400, color: seoTitleLen > 60 ? colors.red : colors.textLight, marginLeft: 8 }}>
                  {seoTitleLen}/60
                </span>
              </label>
              <input
                type="text"
                value={form.seoTitle}
                onChange={(e) => updateField('seoTitle', e.target.value)}
                placeholder="검색 엔진에 표시될 제목"
                style={{
                  ...s.input,
                  borderColor: seoTitleLen > 60 ? colors.red : colors.border,
                }}
              />
            </div>
            <div>
              <label style={s.label}>
                SEO 설명
                <span style={{ fontWeight: 400, color: seoDescLen > 160 ? colors.red : colors.textLight, marginLeft: 8 }}>
                  {seoDescLen}/160
                </span>
              </label>
              <textarea
                value={form.seoDescription}
                onChange={(e) => {
                  updateField('seoDescription', e.target.value);
                  updateField('excerpt', e.target.value);
                }}
                placeholder="검색 결과에 표시될 설명"
                rows={3}
                style={{
                  ...s.input,
                  resize: 'vertical' as const,
                  minHeight: 72,
                  borderColor: seoDescLen > 160 ? colors.red : colors.border,
                }}
              />
            </div>
          </div>

          <div style={divider} />

          {/* SEO / GEO Scores */}
          <div>
            <div style={sectionTitle}>SEO / GEO 점수</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 16 }}>
              <ScoreCircle score={scores.seoScore} label="SEO" />
              <ScoreCircle score={scores.geoScore} label="GEO" />
              <ScoreCircle score={scores.totalScore} label="종합" />
            </div>
            {scores.seoCategories.map((cat: any, i: number) => (
              <ScoreCategoryPanel key={`seo-${i}`} category={cat} defaultOpen={false} />
            ))}
            {scores.geoCategories.map((cat: any, i: number) => (
              <ScoreCategoryPanel key={`geo-${i}`} category={cat} defaultOpen={false} />
            ))}
          </div>

          <div style={divider} />

          {/* 7. 공유 미리보기 */}
          <div>
            <div style={sectionTitle}>공유 미리보기</div>

            {/* 카카오톡 / Facebook */}
            <div style={{ fontSize: 12, fontWeight: 600, color: colors.textLight, marginBottom: 8 }}>
              카카오톡 / Facebook
            </div>
            <div
              style={{
                border: '1px solid #e8e8e8',
                borderRadius: 8,
                overflow: 'hidden',
                marginBottom: 16,
              }}
            >
              {mainImageUrl && (
                <img
                  src={mainImageUrl}
                  alt="미리보기"
                  style={{ width: '100%', height: 160, objectFit: 'cover' }}
                />
              )}
              <div style={{ padding: '12px 14px' }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: colors.text,
                    marginBottom: 4,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {previewTitle}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: colors.textLight,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {previewDesc}
                </div>
                <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>{previewUrl}</div>
              </div>
            </div>

            {/* Google 검색결과 */}
            <div style={{ fontSize: 12, fontWeight: 600, color: colors.textLight, marginBottom: 8 }}>
              Google 검색결과
            </div>
            <div
              style={{
                padding: '12px 0',
                borderBottom: '1px solid #e8e8e8',
              }}
            >
              <div style={{ fontSize: 11, color: '#202124', marginBottom: 2 }}>{previewUrl}</div>
              <div
                style={{
                  fontSize: 18,
                  color: '#1a0dab',
                  fontWeight: 400,
                  marginBottom: 4,
                  cursor: 'pointer',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {previewTitle}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: '#4d5156',
                  lineHeight: 1.5,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {previewDesc}
              </div>
            </div>
          </div>

          <div style={divider} />

          {/* 8. 템플릿 */}
          <div>
            <div style={sectionTitle}>템플릿</div>
            <button
              onClick={onSaveTemplate}
              style={{ ...s.btn, ...s.btnOutline, width: '100%', marginBottom: 12 }}
            >
              현재 설정을 템플릿으로 저장
            </button>
            {templates.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {templates.map((tpl: any) => (
                  <div
                    key={tpl._id || tpl.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      border: '1px solid #e8e8e8',
                      borderRadius: 8,
                      fontSize: 13,
                    }}
                  >
                    <span
                      style={{ cursor: 'pointer', flex: 1 }}
                      onClick={() => onApplyTemplate(tpl)}
                    >
                      {tpl.title || tpl.name || '무제 템플릿'}
                    </span>
                    <button
                      onClick={() => onDeleteTemplate(tpl._id || tpl.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 14,
                        color: colors.red,
                        padding: '2px 6px',
                      }}
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            padding: '16px 24px 20px',
            borderTop: '1px solid #e8e8e8',
            position: 'sticky',
            bottom: 0,
            background: '#fff',
            borderRadius: '0 0 16px 16px',
          }}
        >
          <button
            onClick={onClose}
            disabled={saving}
            style={{ ...s.btn, ...s.btnOutline }}
          >
            취소
          </button>
          <button
            onClick={() => onSave(false)}
            disabled={saving}
            style={{ ...s.btn, ...s.btnOutline }}
          >
            {saving ? '저장 중...' : '임시저장'}
          </button>
          <button
            onClick={() => onSave(true)}
            disabled={saving}
            style={{
              ...s.btn,
              background: '#03c75a',
              color: '#fff',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? '발행 중...' : '발행하기'}
          </button>
        </div>
      </div>
    </div>
  );
}
