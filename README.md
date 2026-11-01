# Extra Credit 제출 조회

학생용 페이지: [Extra Credit 제출 조회](https://vida-holgada.github.io/extra-credit-check-2026-2/)

2026-2 과학기술과문명(31004·31005)과 인공지능과현대사회(31001)의 Extra Credit #1–#5 제출 여부와 제출 메일 수신 시각을 조회합니다. 성적이나 점수를 조회하지 않습니다.

## GitHub Pages 배포

`vida-holgada` 계정의 GitHub Pages에서 실행됩니다. `main`은 개발 소스, `gh-pages`는 게시 파일입니다. 기존 수업 사이트와 같은 GitHub Pages 호스팅을 사용하며, ChatGPT Sites나 별도 서버에 접속하지 않습니다.

```sh
npm ci
npm run build:pages
npm run preview:pages
```

`dist-pages/`의 내용을 `gh-pages` 브랜치 루트에 게시합니다. 저장소 Settings → Pages의 소스는 `gh-pages` 브랜치의 `/`입니다.

## 제출 기록 갱신

원본 정리 JSON으로 로컬 `.dev.vars`를 생성한 다음 다시 빌드합니다.

```sh
node scripts/prepare-receipts.mjs <local-source.json> .dev.vars
npm run build:pages
```

빌드 환경의 `EC_DATA_JSON`에 정리된 최소 데이터 JSON을 지정할 수도 있습니다. 원본 명단·이름·학번·메일과 `.dev.vars`는 Git에 추가하지 않습니다.

공개 게시 파일에는 학생별 암호화된 조회 결과만 포함합니다. 브라우저는 입력한 학번에 대응하는 파일 하나를 받아 복호화합니다. 이름은 조회 데이터에서 제외하며, 학번이나 전체 명단을 원문으로 게시하지 않습니다. 학번을 아는 사람은 해당 기록을 조회할 수 있는 구조이며, 개인별 로그인 인증 기능은 없습니다.

## 로컬 서버 구현

기존 서버 구현은 `npm run dev`로 실행할 수 있습니다. 실제 운영 배포는 위 GitHub Pages 빌드를 사용합니다. `.env.example`에는 설정 이름만 포함되어 있습니다.
