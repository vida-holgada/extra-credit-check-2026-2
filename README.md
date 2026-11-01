# Extra Credit 제출 조회

2026-2 과목 수강생이 학번으로 본인 수업의 Extra Credit #1–#5 제출 여부와 제출 메일 수신 시각을 조회하는 웹앱입니다. 성적이나 점수를 조회하지 않습니다. 과학기술과문명(2개 분반)과 인공지능과현대사회(1개 분반), 총 2개 과목 3개 분반을 지원합니다.

학생용 접속 주소: [Extra Credit 제출 조회](https://extra-credit-check-2026-2.hvnthevoyager.chatgpt.site)

로그인 없이 학번으로 조회합니다. 화면에는 이름과 전체 명단을 표시하지 않으며, 입력한 학번에 해당하는 수업·제출 여부·제출 시각만 반환합니다.

## 시작하기

```sh
npm ci
```

검토용 예시 데이터로 실행하려면 프로젝트 루트의 `.dev.vars`에 다음 값을 두고 개발 서버를 시작합니다. `.dev.vars`는 Git에서 제외됩니다.

```sh
EC_DEMO_MODE="true"
```

```sh
npm run dev
```

예시 조회 학번은 `00000001`, `00000002`, `00000003`입니다. 예시 결과에는 실제 학생 정보가 없습니다.

## 실제 데이터 설정

실제 제출 기록은 브라우저 코드에 포함하지 않습니다. 실행 환경에서 서버 전용 변수 `EC_DEMO_MODE`와 `EC_DATA_JSON_1`부터 `EC_DATA_JSON_8`까지 설정합니다. 로컬 개발에서는 원본 JSON을 준비한 뒤 아래 명령으로 `.dev.vars`를 생성할 수 있습니다.

```sh
node scripts/prepare-receipts.mjs <local-source.json> .dev.vars
```

원본 JSON과 생성된 `.dev.vars`는 저장소에 추가하지 마세요. `.dev.vars`는 `.gitignore`에 포함되어 있습니다.

## 빌드

```sh
npm run build
```
