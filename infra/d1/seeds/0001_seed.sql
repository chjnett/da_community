INSERT OR IGNORE INTO boards (id, name, slug, description, type, is_active)
VALUES
  (1, '자유게시판', 'free', '자유롭게 이야기해요', 'CAMPUS', 1),
  (2, '새내기게시판', 'freshman', '새내기 전용', 'CAMPUS', 1),
  (3, '취업/진로', 'career', '취업, 진로 고민', 'CAMPUS', 1),
  (4, '라운지', 'lounge', '실시간 대화 라운지', 'LOUNGE', 1);
