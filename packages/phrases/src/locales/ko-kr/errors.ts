const errors = {
  auth: {
    authorization_header_missing: '인증 헤더가 존재하지 않아요.',
    authorization_token_type_not_supported: '해당 인증 방법을 지원하지 않아요.',
    unauthorized: '인증되지 않았어요. 로그인 정보와 범위를 확인해주세요.',
    forbidden: '접근이 금지되었어요. 로그인 권한와 직책을 확인해주세요.',
    expected_role_not_found:
      'Expected role not found. Please check your user roles and permissions.',
    jwt_sub_missing: 'JWT에서 `sub`를 찾을 수 없어요.',
  },
  guard: {
    invalid_input: '{{type}} 요청 타입은 유효하지 않아요.',
    invalid_pagination: '요청의 Pagination 값이 유효하지 않아요.',
  },
  oidc: {
    aborted: 'End 사용자가 상호 작용을 중단했어요.',
    invalid_scope: '{{scope}} 범위를 지원하지 않아요.',
    invalid_scope_plural: '{{scopes}} 범위들을 지원하지 않아요.',
    invalid_token: '유요하지 않은 토큰이 제공되었어요.',
    invalid_client_metadata: '유효하지 않은 클라이언트 메타데이터가 제공되었어요.',
    insufficient_scope: '요청된 {{scopes}} 범위에서 Access 토큰을 찾을 수 없어요.',
    invalid_request: '요청이 유효하지 않아요.',
    invalid_grant: '승인 요청이 유효하지 않아요.',
    invalid_redirect_uri: '`redirect_uri`가 등록된 클라이언트의 `redirect_uris`와 일치하지 않아요.',
    access_denied: '접근이 금지되었어요.',
    invalid_target: '유요하지 않은 리소스 표시에요..',
    unsupported_grant_type: '지원하지 않는 `grant_type` 요청이에요.',
    unsupported_response_mode: '지원하지 않는 `response_mode` 요청이에요.',
    unsupported_response_type: '지원하지 않은 `response_type` 요청이에요.',
    provider_error: 'OIDC 내부 오류: {{message}}.',
  },
  user: {
    username_exists_register: '사용자 이름이 이미 등록되있어요.',
    email_exists_register: '이메일이 이미 등록되있어요.',
    phone_exists_register: '휴대전화번호가 이미 등록되있어요.',
    invalid_email: '유효하지 않은 이메일이예요.',
    invalid_phone: '유효하지 않은 휴대전화번호에요',
    email_not_exists: '이메일 주소가 아직 등록되지 않았어요.',
    phone_not_exists: '휴대전화번호가 아직 등록되지 않았어요.',
    identity_not_exists: '소셜 계정이 아직 등록되지 않았어요.',
    identity_exists: '소셜 계정이 이미 등록되있어요.',
    invalid_role_names: '직책 명({{roleNames}})이 유효하지 않아요.',
    cannot_delete_self: 'You cannot delete yourself.', // UNTRANSLATED
    same_password: 'Your new password can not be the same as current password.', // UNTRANSLATED
  },
  password: {
    unsupported_encryption_method: '{{name}} 암호화 방법을 지원하지 않아요.',
    pepper_not_found: '비밀번호 Pepper를 찾을 수 없어요. Core 환경설정을 확인해주세요.',
  },
  session: {
    not_found: '세션을 찾을 수 없어요. 다시 로그인해주세요.',
    invalid_credentials: '유효하지 않은 로그인 정보예요. 입력된 값을 다시 확인해주세요.',
    invalid_sign_in_method: '현재 로그인 방법을 지원하지 않아요.',
    invalid_connector_id: '소셜 ID {{connectorId}}를 찾을 수 없어요..',
    insufficient_info: '로그인 정보가 충분하지 않아요.',
    connector_id_mismatch: '연동 ID가 세션 정보와 일치하지 않아요.',
    connector_session_not_found: '연동 세션을 찾을 수 없어요. 다시 로그인해주세요.',
    forgot_password_session_not_found:
      'Forgot password session not found. Please go back and verify.', // UNTRANSLATED
    forgot_password_verification_expired:
      'Forgot password verification has expired. Please go back and verify again.', // UNTRANSLATED
    unauthorized: '로그인을 먼저 해주세요.',
    unsupported_prompt_name: '지원하지 않는 Prompt 이름이예요.',
  },
  connector: {
    general: '연동 중에 알 수 없는 오류가 발생했어요. {{errorDescription}}',
    not_found: '{{type}} 값을 가진 연동 종류를 찾을 수 없어요.',
    not_enabled: '연동이 활성화 되지 않았어요.',
    invalid_metadata: "The connector's metadata is invalid.", // UNTRANSLATED
    invalid_config_guard: "The connector's config guard is invalid.", // UNTRANSLATED
    unexpected_type: "The connector's type is unexpected.", // UNTRANSLATED
    invalid_request_parameters: 'The request is with wrong input parameter(s).', // UNTRANSLATED
    insufficient_request_parameters: '요청 데이터에서 일부 정보가 없어요.',
    invalid_config: '연동 설정이 유효하지 않아요.',
    invalid_response: '연동 응답이 유효하지 않아요.',
    template_not_found: '연동 예제 설정을 찾을 수 없어요.',
    not_implemented: '{{method}}은 아직 구현되지 않았어요.',
    social_invalid_access_token: '연동 서비스의 Access 토큰이 유효하지 않아요.',
    invalid_auth_code: '연동 서비스의 Auth 코드가 유효하지 않아요.',
    social_invalid_id_token: '연동 서비스의 ID 토큰이 유효하지 않아요.',
    authorization_failed: '사용자의 인증 과정이 성공적으로 마무리되지 않았어요.',
    social_auth_code_invalid: 'Access 토큰을 가져올 수 없어요. Authorization 코드를 확인해주세요.',
    more_than_one_sms: '연동된 SMS 서비스가 1개 이상이여야 해요.',
    more_than_one_email: '연동된 이메일 서비스가 1개 이상이여야 해요.',
    db_connector_type_mismatch: '종류가 일치하지 않은 연동 서비스가 DB에 존재해요.',
  },
  passcode: {
    phone_email_empty: '휴대전화번호 그리고 이메일이 비어있어요.',
    not_found: '비밀번호를 찾을 수 없어요. 비밀번호를 먼저 보내주세요.',
    phone_mismatch: '휴대전화번호가 일치하지 않아요. 새로운 비밀번호를 요청해주세요.',
    email_mismatch: '이메일이 일치하지 않아요. 새로운 비밀번호를 요청해주세요.',
    code_mismatch: '비밀번호가 유효하지 않아요.',
    expired: '비밀번호가 만료되었어요. 새로운 비밀번호를 요청해주세요.',
    exceed_max_try: '해당 비밀번호는 인증 횟수를 초과하였어요. 새로운 비밀번호를 요청해주세요.',
  },
  sign_in_experiences: {
    empty_content_url_of_terms_of_use:
      '이용약관 URL이 비어있어요. 이용약관이 활성화되어있다면, 이용약관 URL를 설정해주세요.',
    empty_logo: '로고 URL을 입력해주세요.',
    empty_slogan: '브랜딩 슬로건이 비어있어요. 슬로건을 사용한다면, 내용을 설정해주세요.',
    empty_social_connectors: '연동된 소셜이 없어요. 소셜 로그인을 사용한다면, 연동해주세요.',
    enabled_connector_not_found: '활성된 {{type}} 연동을 찾을 수 없어요.',
    not_one_and_only_one_primary_sign_in_method:
      '반드시 하나의 메인 로그인 방법이 설정되어야 해요. 입력된 값을 확인해주세요.',
    unsupported_default_language: 'This language - {{language}} is not supported at the moment.', // UNTRANSLATED
  },
  localization: {
    cannot_delete_default_language:
      '{{languageTag}} is set as your default language and can’t be deleted.', // UNTRANSLATED
    invalid_translation_structure: 'Invalid data schemas. Please check your input and try again.', // UNTRANSLATED
  },
  swagger: {
    invalid_zod_type: '유요하지 않은 Zod 종류에요. Route Guard 설정을 확인해주세요.',
    not_supported_zod_type_for_params:
      '지원되지 않는 Zod 종류예요. Route Guard 설정을 확인해주세요.',
  },
  entity: {
    create_failed: '{{name}} 생성을 실패하였어요..',
    not_exists: '{{name}}는 존재하지 않아요.',
    not_exists_with_id: '{{id}} ID를 가진 {{name}}는 존재하지 않아요.',
    not_found: '리소스가 존재하지 않아요.',
  },
};

export default errors;
