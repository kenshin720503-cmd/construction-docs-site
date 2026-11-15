-- 견적 요청 표. 자동으로 만들지 못했을 때만 Supabase SQL Editor에 붙여 넣고 Run.
-- message 칸에는 "필요한 서류" 값이 들어간다.
create table if not exists public.inquiries (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  name text not null,
  contact text not null,
  message text,
  consent boolean not null default false,
  status text not null default '새 문의' check (status in ('새 문의', '연락함', '완료')),
  updated_at timestamptz
);
alter table public.inquiries enable row level security;
revoke all on public.inquiries from anon, authenticated;
-- 정책은 만들지 않는다: 브라우저(공개 키)로는 접근 불가, 서버(/api)만 접근
