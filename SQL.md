mysql> use relateme;
Database changed
mysql> show tables;
+-----------------------------+
| Tables_in_relateme          |
+-----------------------------+
| tbl_activity                |
| tbl_activity_participant    |
| tbl_app_user                |
| tbl_ca_member               |
| tbl_ca_member_fact          |
| tbl_campaign_goal           |
| tbl_dnd                     |
| tbl_institute_details       |
| tbl_member_education        |
| tbl_member_emails           |
| tbl_member_phones           |
| tbl_member_social_profiles  |
| tbl_org_details             |
| tbl_user_auth               |
| tbl_voter                   |
| tbl_voter_education_history |
| tbl_voter_icai_roles        |
| tbl_voter_preference        |
| tbl_work_history            |
+-----------------------------+
19 rows in set (0.06 sec)

mysql> DESCRIBE tbl_activity;
+--------------------+--------------------------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
| Field              | Type                                                               | Null | Key | Default           | Extra                                         |
+--------------------+--------------------------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
| activity_id        | bigint                                                             | NO   | PRI | NULL              | auto_increment                                |
| activity_type      | enum('Call','Meeting','WhatsApp','SMS','Email','Event','Referral') | NO   | MUL | NULL              |                                               |
| activity_date      | date                                                               | NO   | MUL | NULL              |                                               |
| description        | text                                                               | YES  |     | NULL              |                                               |
| followup_date      | date                                                               | YES  |     | NULL              |                                               |
| followup_note      | text                                                               | YES  |     | NULL              |                                               |
| assigned_to        | char(36)                                                           | YES  | MUL | NULL              |                                               |
| preference_outcome | enum('Confirmed','Lean','Undecided','Opposition','Unknown')        | YES  |     | NULL              |                                               |
| created_at         | datetime                                                           | NO   |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| created_by         | char(36)                                                           | YES  | MUL | NULL              |                                               |
| updated_at         | datetime                                                           | NO   |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| updated_by         | char(36)                                                           | YES  | MUL | NULL              |                                               |
+--------------------+--------------------------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
12 rows in set (0.19 sec)

mysql> DESCRIBE tbl_activity_participant;
+------------------+-----------------------------+------+-----+-------------------+-----------------------------------------------+
| Field            | Type                        | Null | Key | Default           | Extra                                         |
+------------------+-----------------------------+------+-----+-------------------+-----------------------------------------------+
| ap_id            | bigint                      | NO   | PRI | NULL              | auto_increment                                |
| activity_id      | bigint                      | NO   | MUL | NULL              |                                               |
| voter_record_id  | bigint                      | NO   | MUL | NULL              |                                               |
| participant_role | enum('Primary','Secondary') | NO   |     | NULL              |                                               |
| created_at       | datetime                    | NO   |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| created_by       | char(36)                    | YES  | MUL | NULL              |                                               |
| updated_at       | datetime                    | NO   |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| updated_by       | char(36)                    | YES  | MUL | NULL              |                                               |
+------------------+-----------------------------+------+-----+-------------------+-----------------------------------------------+
8 rows in set (0.00 sec)

mysql> DESCRIBE tbl_app_user;
+-----------------+----------------------------------------+------+-----+-------------------+-----------------------------------------------+
| Field           | Type                                   | Null | Key | Default           | Extra                                         |
+-----------------+----------------------------------------+------+-----+-------------------+-----------------------------------------------+
| user_id         | char(36)                               | NO   | PRI | NULL              |                                               |
| email           | varchar(255)                           | NO   | UNI | NULL              |                                               |
| full_name       | varchar(200)                           | NO   |     | NULL              |                                               |
| user_role       | enum('Admin','Candidate','Volunteer')  | NO   |     | NULL              |                                               |
| approval_status | enum('Pending','Active','Deactivated') | NO   |     | Pending           |                                               |
| created_at      | datetime                               | NO   |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| created_by      | char(36)                               | YES  | MUL | NULL              |                                               |
| updated_at      | datetime                               | NO   |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| updated_by      | char(36)                               | YES  | MUL | NULL              |                                               |
+-----------------+----------------------------------------+------+-----+-------------------+-----------------------------------------------+
9 rows in set (0.01 sec)

mysql> DESCRIBE tbl_ca_member;
+----------------------+---------------------------+------+-----+-------------------+-----------------------------------------------+
| Field                | Type                      | Null | Key | Default           | Extra                                         |
+----------------------+---------------------------+------+-----+-------------------+-----------------------------------------------+
| icai_membership_no   | varchar(20)               | NO   | PRI | NULL              |                                               |
| member_first_name    | varchar(400)              | NO   |     | NULL              |                                               |
| member_middle_name   | varchar(400)              | YES  |     | NULL              |                                               |
| member_last_name     | varchar(400)              | YES  |     | NULL              |                                               |
| member_display_name  | varchar(1200)             | NO   |     | NULL              |                                               |
| member_dob           | date                      | YES  |     | NULL              |                                               |
| member_gender        | enum('M','F','O')         | YES  |     | NULL              |                                               |
| member_status        | enum('Active','Inactive') | NO   | MUL | Active            |                                               |
| member_region_base   | varchar(100)              | NO   | MUL | NULL              |                                               |
| member_deceased_date | date                      | YES  |     | NULL              |                                               |
| created_at           | datetime                  | NO   |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| created_by           | char(36)                  | YES  | MUL | NULL              |                                               |
| updated_at           | datetime                  | NO   |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| updated_by           | char(36)                  | YES  | MUL | NULL              |                                               |
+----------------------+---------------------------+------+-----+-------------------+-----------------------------------------------+
14 rows in set (0.01 sec)

mysql> DESCRIBE tbl_ca_member_fact;
+------------------------+-------------------+------+-----+-------------------+-----------------------------------------------+
| Field                  | Type              | Null | Key | Default           | Extra                                         |
+------------------------+-------------------+------+-----+-------------------+-----------------------------------------------+
| icai_membership_no     | varchar(20)       | NO   | PRI | NULL              |                                               |
| is_fca_member          | enum('Y','N')     | NO   |     | NULL              |                                               |
| membership_grade       | enum('ACA','FCA') | NO   |     | NULL              |                                               |
| member_photo_url       | varchar(500)      | YES  |     | NULL              |                                               |
| member_visiting_url    | varchar(500)      | YES  |     | NULL              |                                               |
| associate_year         | varchar(10)       | YES  |     | NULL              |                                               |
| member_enrollment_date | date              | YES  |     | NULL              |                                               |
| fellow_year            | varchar(10)       | YES  |     | NULL              |                                               |
| member_fca_date        | date              | YES  |     | NULL              |                                               |
| created_at             | datetime          | NO   |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| created_by             | char(36)          | YES  | MUL | NULL              |                                               |
| updated_at             | datetime          | NO   |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| updated_by             | char(36)          | YES  | MUL | NULL              |                                               |
+------------------------+-------------------+------+-----+-------------------+-----------------------------------------------+
13 rows in set (0.01 sec)

mysql> DESCRIBE tbl_campaign_goal;
+---------------+----------+------+-----+-------------------+-------------------+
| Field         | Type     | Null | Key | Default           | Extra             |
+---------------+----------+------+-----+-------------------+-------------------+
| goal_id       | bigint   | NO   | PRI | NULL              | auto_increment    |
| election_year | smallint | NO   | MUL | NULL              |                   |
| prev_quota    | int      | NO   |     | 0                 |                   |
| target_total  | int      | NO   |     | 0                 |                   |
| target_p1     | int      | NO   |     | 0                 |                   |
| target_p2     | int      | NO   |     | 0                 |                   |
| target_p3     | int      | NO   |     | 0                 |                   |
| target_p4     | int      | NO   |     | 0                 |                   |
| created_at    | datetime | NO   | MUL | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
| created_by    | char(36) | YES  | MUL | NULL              |                   |
+---------------+----------+------+-----+-------------------+-------------------+
10 rows in set (0.00 sec)

mysql> DESCRIBE tbl_dnd;
+-----------------+--------------------------+------+-----+-------------------+-----------------------------------------------+
| Field           | Type                     | Null | Key | Default           | Extra                                         |
+-----------------+--------------------------+------+-----+-------------------+-----------------------------------------------+
| dnd_id          | bigint                   | NO   | PRI | NULL              | auto_increment                                |
| voter_record_id | bigint                   | NO   | UNI | NULL              |                                               |
| dnd_from        | date                     | NO   |     | NULL              |                                               |
| reason          | varchar(500)             | YES  |     | NULL              |                                               |
| dnd_status      | enum('Active','Removed') | NO   |     | Active            |                                               |
| removed_at      | datetime                 | YES  |     | NULL              |                                               |
| removed_by      | char(36)                 | YES  | MUL | NULL              |                                               |
| created_at      | datetime                 | NO   |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| created_by      | char(36)                 | YES  | MUL | NULL              |                                               |
| updated_at      | datetime                 | NO   |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| updated_by      | char(36)                 | YES  | MUL | NULL              |                                               |
+-----------------+--------------------------+------+-----+-------------------+-----------------------------------------------+
11 rows in set (0.00 sec)

mysql> DESCRIBE tbl_institute_details;
+------------------+---------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
| Field            | Type                                              | Null | Key | Default           | Extra                                         |
+------------------+---------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
| institute_id     | bigint                                            | NO   | PRI | NULL              | auto_increment                                |
| institute_name   | varchar(300)                                      | NO   |     | NULL              |                                               |
| institute_type   | enum('SCHOOL','COLLEGE','UNIVERSITY','INSTITUTE') | NO   |     | NULL              |                                               |
| affiliation_type | enum('AFFILIATED','AUTONOMOUS','DEEMED')          | YES  |     | NULL              |                                               |
| governing_body   | varchar(150)                                      | YES  |     | NULL              |                                               |
| established_year | smallint                                          | YES  |     | NULL              |                                               |
| institute_status | enum('ACTIVE','INACTIVE')                         | NO   |     | ACTIVE            |                                               |
| created_at       | datetime                                          | NO   |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| created_by       | char(36)                                          | YES  | MUL | NULL              |                                               |
| updated_at       | datetime                                          | NO   |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| updated_by       | char(36)                                          | YES  | MUL | NULL              |                                               |
+------------------+---------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
11 rows in set (0.01 sec)

mysql> DESCRIBE tbl_member_education;
+----------------------+---------------------------------------------+------+-----+-------------------+-----------------------------------------------+
| Field                | Type                                        | Null | Key | Default           | Extra                                         |
+----------------------+---------------------------------------------+------+-----+-------------------+-----------------------------------------------+
| member_education_id  | bigint                                      | NO   | PRI | NULL              | auto_increment                                |
| icai_membership_no   | varchar(20)                                 | NO   | MUL | NULL              |                                               |
| qualification        | varchar(20)                                 | YES  |     | NULL              |                                               |
| specialisation       | varchar(100)                                | YES  |     | NULL              |                                               |
| qualification_family | varchar(100)                                | YES  |     | NULL              |                                               |
| study_mode           | enum('Correspondence','Regular','Distance') | YES  |     | NULL              |                                               |
| institution_name     | varchar(100)                                | YES  |     | NULL              |                                               |
| university_name      | varchar(100)                                | YES  |     | NULL              |                                               |
| graduation_year      | year                                        | YES  |     | NULL              |                                               |
| batch_year_from      | year                                        | YES  |     | NULL              |                                               |
| batch_year_to        | year                                        | YES  |     | NULL              |                                               |
| education_status     | enum('Valid','Invalid')                     | YES  |     | NULL              |                                               |
| created_at           | datetime                                    | NO   |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| created_by           | char(36)                                    | YES  | MUL | NULL              |                                               |
| updated_at           | datetime                                    | NO   |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| updated_by           | char(36)                                    | YES  | MUL | NULL              |                                               |
+----------------------+---------------------------------------------+------+-----+-------------------+-----------------------------------------------+
16 rows in set (0.01 sec)

mysql> DESCRIBE tbl_member_emails;
+--------------------+----------------------------+------+-----+-------------------+-----------------------------------------------+
| Field              | Type                       | Null | Key | Default           | Extra                                         |
+--------------------+----------------------------+------+-----+-------------------+-----------------------------------------------+
| email_id           | bigint                     | NO   | PRI | NULL              | auto_increment                                |
| icai_membership_no | varchar(20)                | NO   | MUL | NULL              |                                               |
| email_address      | varchar(400)               | NO   |     | NULL              |                                               |
| email_type         | enum('Personal','Company') | NO   |     | NULL              |                                               |
| email_status       | enum('Active','Inactive')  | NO   |     | Active            |                                               |
| email_is_primary   | tinyint(1)                 | NO   |     | 0                 |                                               |
| created_at         | datetime                   | NO   |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| created_by         | char(36)                   | YES  | MUL | NULL              |                                               |
| updated_at         | datetime                   | NO   |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| updated_by         | char(36)                   | YES  | MUL | NULL              |                                               |
+--------------------+----------------------------+------+-----+-------------------+-----------------------------------------------+
10 rows in set (0.01 sec)

mysql> DESCRIBE tbl_member_phones;
+--------------------+-----------------------------+------+-----+-------------------+-----------------------------------------------+
| Field              | Type                        | Null | Key | Default           | Extra                                         |
+--------------------+-----------------------------+------+-----+-------------------+-----------------------------------------------+
| phone_id           | bigint                      | NO   | PRI | NULL              | auto_increment                                |
| icai_membership_no | varchar(20)                 | NO   | MUL | NULL              |                                               |
| phone_country_code | varchar(8)                  | NO   |     | NULL              |                                               |
| phone_number       | varchar(20)                 | NO   |     | NULL              |                                               |
| phone_number_full  | varchar(30)                 | NO   |     | NULL              |                                               |
| phone_type         | enum('Personal','Official') | NO   |     | NULL              |                                               |
| is_whatsapp        | tinyint(1)                  | NO   |     | 0                 |                                               |
| phone_status       | enum('Active','Inactive')   | NO   |     | Active            |                                               |
| phone_is_primary   | tinyint(1)                  | NO   |     | 0                 |                                               |
| created_at         | datetime                    | NO   |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| created_by         | char(36)                    | YES  | MUL | NULL              |                                               |
| updated_at         | datetime                    | NO   |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| updated_by         | char(36)                    | YES  | MUL | NULL              |                                               |
+--------------------+-----------------------------+------+-----+-------------------+-----------------------------------------------+
13 rows in set (0.01 sec)

mysql> DESCRIBE tbl_member_social_profiles;
+--------------------+---------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
| Field              | Type                                              | Null | Key | Default           | Extra                                         |
+--------------------+---------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
| social_id          | int                                               | NO   | PRI | NULL              | auto_increment                                |
| icai_membership_no | varchar(20)                                       | NO   | MUL | NULL              |                                               |
| social_platform    | enum('Facebook','LinkedIn','Instagram','Twitter') | YES  |     | NULL              |                                               |
| social_handle_url  | varchar(255)                                      | YES  |     | NULL              |                                               |
| social_media_type  | enum('Personal','Official','Generic')             | YES  |     | NULL              |                                               |
| social_status      | enum('Active','Inactive')                         | NO   |     | Active            |                                               |
| created_at         | datetime                                          | NO   |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| created_by         | char(36)                                          | YES  | MUL | NULL              |                                               |
| updated_at         | datetime                                          | NO   |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| updated_by         | char(36)                                          | YES  | MUL | NULL              |                                               |
+--------------------+---------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
10 rows in set (0.01 sec)

mysql> DESCRIBE tbl_org_details;
+---------------+-----------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
| Field         | Type                                                | Null | Key | Default           | Extra                                         |
+---------------+-----------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
| org_id        | bigint                                              | NO   | PRI | NULL              | auto_increment                                |
| org_name      | varchar(300)                                        | NO   |     | NULL              |                                               |
| org_reg_no    | varchar(100)                                        | YES  | UNI | NULL              |                                               |
| org_type      | enum('CA','NON_CA')                                 | NO   | MUL | NULL              |                                               |
| org_structure | enum('PARTNERSHIP','SOLE_PROP','LLP','PRIVATE_LTD') | NO   |     | NULL              |                                               |
| org_status    | enum('ACTIVE','INACTIVE')                           | NO   |     | ACTIVE            |                                               |
| created_at    | datetime                                            | NO   |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| created_by    | char(36)                                            | YES  | MUL | NULL              |                                               |
| updated_at    | datetime                                            | NO   |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| updated_by    | char(36)                                            | YES  | MUL | NULL              |                                               |
+---------------+-----------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
10 rows in set (0.00 sec)

mysql> DESCRIBE tbl_user_auth;
+---------------+--------------+------+-----+-------------------+-----------------------------------------------+
| Field         | Type         | Null | Key | Default           | Extra                                         |
+---------------+--------------+------+-----+-------------------+-----------------------------------------------+
| user_id       | char(36)     | NO   | PRI | NULL              |                                               |
| password_hash | varchar(255) | NO   |     | NULL              |                                               |
| created_at    | datetime     | NO   |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| updated_at    | datetime     | NO   |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
+---------------+--------------+------+-----+-------------------+-----------------------------------------------+
4 rows in set (0.00 sec)

mysql> DESCRIBE tbl_voter;
+--------------------+------------------------------------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
| Field              | Type                                                                         | Null | Key | Default           | Extra                                         |
+--------------------+------------------------------------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
| voter_record_id    | bigint                                                                       | NO   | PRI | NULL              | auto_increment                                |
| election_year      | smallint                                                                     | NO   | MUL | NULL              |                                               |
| voter_id           | varchar(50)                                                                  | NO   |     | NULL              |                                               |
| icai_membership_no | varchar(20)                                                                  | NO   | MUL | NULL              |                                               |
| voter_region       | varchar(100)                                                                 | NO   | MUL | NULL              |                                               |
| voter_booth_no     | varchar(50)                                                                  | YES  |     | NULL              |                                               |
| voter_type         | enum('Booth','Postal')                                                       | NO   | MUL | NULL              |                                               |
| voter_sub_type     | enum('Booth-Region','Booth-Other Region','Postal-Domestic','Postal-Foreign') | YES  |     | NULL              |                                               |
| voter_status       | enum('Active','Inactive','Blocked')                                          | NO   |     | Active            |                                               |
| created_at         | datetime                                                                     | NO   |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| created_by         | char(36)                                                                     | YES  | MUL | NULL              |                                               |
| updated_at         | datetime                                                                     | NO   |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| updated_by         | char(36)                                                                     | YES  | MUL | NULL              |                                               |
+--------------------+------------------------------------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
13 rows in set (0.01 sec)

mysql> DESCRIBE tbl_voter_education_history;
+--------------------+-----------------------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
| Field              | Type                                                            | Null | Key | Default           | Extra                                         |
+--------------------+-----------------------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
| edu_hist_id        | bigint                                                          | NO   | PRI | NULL              | auto_increment                                |
| voter_record_id    | bigint                                                          | NO   | MUL | NULL              |                                               |
| edu_course_type    | enum('CA Course','Articleship','University','Coaching','Other') | NO   |     | NULL              |                                               |
| institute_id       | bigint                                                          | YES  | MUL | NULL              |                                               |
| org_id             | bigint                                                          | YES  | MUL | NULL              |                                               |
| qualification_name | varchar(200)                                                    | YES  |     | NULL              |                                               |
| from_year          | year                                                            | YES  |     | NULL              |                                               |
| to_year            | year                                                            | YES  |     | NULL              |                                               |
| edu_status         | enum('Active','Completed','Unknown')                            | NO   |     | NULL              |                                               |
| principal_voter_id | bigint                                                          | YES  | MUL | NULL              |                                               |
| created_at         | datetime                                                        | NO   |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| created_by         | char(36)                                                        | YES  | MUL | NULL              |                                               |
| updated_at         | datetime                                                        | NO   |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| updated_by         | char(36)                                                        | YES  | MUL | NULL              |                                               |
+--------------------+-----------------------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
14 rows in set (0.00 sec)

mysql> DESCRIBE tbl_voter_icai_roles;
+-----------------+----------------------------------------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
| Field           | Type                                                                             | Null | Key | Default           | Extra                                         |
+-----------------+----------------------------------------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
| role_id         | bigint                                                                           | NO   | PRI | NULL              | auto_increment                                |
| voter_record_id | bigint                                                                           | NO   | MUL | NULL              |                                               |
| role_type       | enum('Branch Committee','CPE Speaker','ICAI Committee','Specialization','Other') | NO   | MUL | NULL              |                                               |
| role_value      | varchar(300)                                                                     | NO   |     | NULL              |                                               |
| from_year       | year                                                                             | YES  |     | NULL              |                                               |
| to_year         | year                                                                             | YES  |     | NULL              |                                               |
| created_at      | datetime                                                                         | NO   |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| created_by      | char(36)                                                                         | YES  | MUL | NULL              |                                               |
| updated_at      | datetime                                                                         | NO   |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| updated_by      | char(36)                                                                         | YES  | MUL | NULL              |                                               |
+-----------------+----------------------------------------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
10 rows in set (0.00 sec)

mysql> DESCRIBE tbl_voter_preference;
+--------------------+-------------------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
| Field              | Type                                                        | Null | Key | Default           | Extra                                         |
+--------------------+-------------------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
| pref_id            | bigint                                                      | NO   | PRI | NULL              | auto_increment                                |
| voter_record_id    | bigint                                                      | NO   | UNI | NULL              |                                               |
| preference_tier    | enum('p1','p2','p3','p4','un')                              | NO   | MUL | NULL              |                                               |
| support_status     | enum('Confirmed','Lean','Undecided','Opposition','Unknown') | NO   | MUL | NULL              |                                               |
| pvs_score          | int                                                         | YES  |     | NULL              |                                               |
| pvs_score_previous | int                                                         | YES  |     | NULL              |                                               |
| created_at         | datetime                                                    | NO   |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| created_by         | char(36)                                                    | YES  | MUL | NULL              |                                               |
| updated_at         | datetime                                                    | NO   |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| updated_by         | char(36)                                                    | YES  | MUL | NULL              |                                               |
+--------------------+-------------------------------------------------------------+------+-----+-------------------+-----------------------------------------------+
10 rows in set (0.00 sec)

mysql> DESCRIBE tbl_work_history;
+-----------------+---------------------------------------------+------+-----+-------------------+-----------------------------------------------+
| Field           | Type                                        | Null | Key | Default           | Extra                                         |
+-----------------+---------------------------------------------+------+-----+-------------------+-----------------------------------------------+
| wh_id           | bigint                                      | NO   | PRI | NULL              | auto_increment                                |
| voter_record_id | bigint                                      | NO   | MUL | NULL              |                                               |
| org_id          | bigint                                      | NO   | MUL | NULL              |                                               |
| designation     | varchar(100)                                | NO   |     | NULL              |                                               |
| from_year       | year                                        | NO   |     | NULL              |                                               |
| to_year         | year                                        | YES  |     | NULL              |                                               |
| is_current      | tinyint(1)                                  | NO   |     | 0                 |                                               |
| work_type       | enum('Employment','Articleship','Practice') | NO   |     | NULL              |                                               |
| work_status     | enum('Active','Completed')                  | NO   |     | NULL              |                                               |
| created_at      | datetime                                    | NO   |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
| created_by      | char(36)                                    | YES  | MUL | NULL              |                                               |
| updated_at      | datetime                                    | NO   |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
| updated_by      | char(36)                                    | YES  | MUL | NULL              |                                               |
+-----------------+---------------------------------------------+------+-----+-------------------+-----------------------------------------------+
13 rows in set (0.00 sec)

mysql> SHOW CREATE TABLE tbl_activity;
+--------------+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| Table        | Create Table                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
+--------------+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| tbl_activity | CREATE TABLE `tbl_activity` (
  `activity_id` bigint NOT NULL AUTO_INCREMENT,
  `activity_type` enum('Call','Meeting','WhatsApp','SMS','Email','Event','Referral') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `activity_date` date NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `followup_date` date DEFAULT NULL,
  `followup_note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `assigned_to` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'team member responsible for follow-up',
  `preference_outcome` enum('Confirmed','Lean','Undecided','Opposition','Unknown') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'NULL = no change recorded',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`activity_id`),
  KEY `idx_activity_date` (`activity_date`),
  KEY `idx_activity_type` (`activity_type`),
  KEY `fk_activity_assigned_to` (`assigned_to`),
  KEY `fk_activity_created_by` (`created_by`),
  KEY `fk_activity_updated_by` (`updated_by`),
  CONSTRAINT `fk_activity_assigned_to` FOREIGN KEY (`assigned_to`) REFERENCES `tbl_app_user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_activity_created_by` FOREIGN KEY (`created_by`) REFERENCES `tbl_app_user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_activity_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `tbl_app_user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='FACT - interaction log' |
+--------------+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
1 row in set (0.02 sec)

mysql> SHOW CREATE TABLE tbl_activity_participant;
+--------------------------+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| Table                    | Create Table                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
+--------------------------+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| tbl_activity_participant | CREATE TABLE `tbl_activity_participant` (
  `ap_id` bigint NOT NULL AUTO_INCREMENT,
  `activity_id` bigint NOT NULL,
  `voter_record_id` bigint NOT NULL,
  `participant_role` enum('Primary','Secondary') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Primary = main target voter',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`ap_id`),
  UNIQUE KEY `uq_activity_participant` (`activity_id`,`voter_record_id`),
  KEY `idx_ap_voter` (`voter_record_id`),
  KEY `fk_ap_created_by` (`created_by`),
  KEY `fk_ap_updated_by` (`updated_by`),
  CONSTRAINT `fk_ap_activity` FOREIGN KEY (`activity_id`) REFERENCES `tbl_activity` (`activity_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ap_created_by` FOREIGN KEY (`created_by`) REFERENCES `tbl_app_user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ap_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `tbl_app_user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ap_voter` FOREIGN KEY (`voter_record_id`) REFERENCES `tbl_voter` (`voter_record_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='RELATION - activity participants (many-to-many)' |
+--------------------------+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
1 row in set (0.00 sec)

mysql> SHOW CREATE TABLE tbl_app_user;
+--------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| Table        | Create Table                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
+--------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| tbl_app_user | CREATE TABLE `tbl_app_user` (
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Auth user ID (UUID)',
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Login email',
  `full_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Display name',
  `user_role` enum('Admin','Candidate','Volunteer') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Drives RLS / permissions',
  `approval_status` enum('Pending','Active','Deactivated') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pending' COMMENT 'New users start Pending',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uq_app_user_email` (`email`),
  KEY `fk_app_user_created_by` (`created_by`),
  KEY `fk_app_user_updated_by` (`updated_by`),
  CONSTRAINT `fk_app_user_created_by` FOREIGN KEY (`created_by`) REFERENCES `tbl_app_user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_app_user_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `tbl_app_user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='MASTER - campaign team members and roles' |
+--------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
1 row in set (0.00 sec)

mysql> SHOW CREATE TABLE tbl_ca_member;
+---------------+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| Table         | Create Table                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
+---------------+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| tbl_ca_member | CREATE TABLE `tbl_ca_member` (
  `icai_membership_no` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ICAI membership number (natural PK)',
  `member_first_name` varchar(400) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `member_middle_name` varchar(400) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `member_last_name` varchar(400) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `member_display_name` varchar(1200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Computed full display name',
  `member_dob` date DEFAULT NULL,
  `member_gender` enum('M','F','O') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `member_status` enum('Active','Inactive') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Active',
  `member_region_base` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ICAI election region at registration',
  `member_deceased_date` date DEFAULT NULL COMMENT 'NULL when alive',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`icai_membership_no`),
  KEY `idx_ca_member_region` (`member_region_base`),
  KEY `idx_ca_member_status` (`member_status`),
  KEY `fk_ca_member_created_by` (`created_by`),
  KEY `fk_ca_member_updated_by` (`updated_by`),
  CONSTRAINT `fk_ca_member_created_by` FOREIGN KEY (`created_by`) REFERENCES `tbl_app_user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ca_member_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `tbl_app_user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='CONFIRMED - ICAI master member record' |
+---------------+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
1 row in set (0.00 sec)

mysql> SHOW CREATE TABLE tbl_ca_member_fact;
+--------------------+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| Table              | Create Table                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
+--------------------+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| tbl_ca_member_fact | CREATE TABLE `tbl_ca_member_fact` (
  `icai_membership_no` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_fca_member` enum('Y','N') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `membership_grade` enum('ACA','FCA') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `member_photo_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `member_visiting_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `associate_year` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ACA year e.g. A2014',
  `member_enrollment_date` date DEFAULT NULL,
  `fellow_year` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'FCA year; NULL if not FCA',
  `member_fca_date` date DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`icai_membership_no`),
  KEY `fk_member_fact_created_by` (`created_by`),
  KEY `fk_member_fact_updated_by` (`updated_by`),
  CONSTRAINT `fk_member_fact_created_by` FOREIGN KEY (`created_by`) REFERENCES `tbl_app_user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_member_fact_member` FOREIGN KEY (`icai_membership_no`) REFERENCES `tbl_ca_member` (`icai_membership_no`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_member_fact_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `tbl_app_user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='CONFIRMED - ICAI facts, 1:1 with tbl_ca_member' |
+--------------------+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
1 row in set (0.00 sec)

mysql> SHOW CREATE TABLE tbl_campaign_goal;
+-------------------+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| Table             | Create Table                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
+-------------------+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| tbl_campaign_goal | CREATE TABLE `tbl_campaign_goal` (
  `goal_id` bigint NOT NULL AUTO_INCREMENT,
  `election_year` smallint NOT NULL,
  `prev_quota` int NOT NULL DEFAULT '0' COMMENT 'previous-year winner quota',
  `target_total` int NOT NULL DEFAULT '0' COMMENT 'expected vote target',
  `target_p1` int NOT NULL DEFAULT '0',
  `target_p2` int NOT NULL DEFAULT '0',
  `target_p3` int NOT NULL DEFAULT '0',
  `target_p4` int NOT NULL DEFAULT '0' COMMENT '>P3 long shot',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`goal_id`),
  KEY `idx_goal_year` (`election_year`),
  KEY `idx_goal_created` (`created_at`),
  KEY `fk_goal_created_by` (`created_by`),
  CONSTRAINT `fk_goal_created_by` FOREIGN KEY (`created_by`) REFERENCES `tbl_app_user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Campaign vote targets; one row per submit = change history' |
+-------------------+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
1 row in set (0.00 sec)

mysql> SHOW CREATE TABLE tbl_dnd;
+---------+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| Table   | Create Table                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
+---------+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| tbl_dnd | CREATE TABLE `tbl_dnd` (
  `dnd_id` bigint NOT NULL AUTO_INCREMENT,
  `voter_record_id` bigint NOT NULL,
  `dnd_from` date NOT NULL,
  `reason` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dnd_status` enum('Active','Removed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Active',
  `removed_at` datetime DEFAULT NULL,
  `removed_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`dnd_id`),
  UNIQUE KEY `uq_dnd_voter` (`voter_record_id`) COMMENT 'one active DND row per voter',
  KEY `fk_dnd_created_by` (`created_by`),
  KEY `fk_dnd_removed_by` (`removed_by`),
  KEY `fk_dnd_updated_by` (`updated_by`),
  CONSTRAINT `fk_dnd_created_by` FOREIGN KEY (`created_by`) REFERENCES `tbl_app_user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_dnd_removed_by` FOREIGN KEY (`removed_by`) REFERENCES `tbl_app_user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_dnd_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `tbl_app_user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_dnd_voter` FOREIGN KEY (`voter_record_id`) REFERENCES `tbl_voter` (`voter_record_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='FACT - Do-Not-Disturb flag per voter' |
+---------+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
1 row in set (0.00 sec)

mysql> SHOW CREATE TABLE tbl_institute_details;
+-----------------------+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| Table                 | Create Table                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
+-----------------------+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| tbl_institute_details | CREATE TABLE `tbl_institute_details` (
  `institute_id` bigint NOT NULL AUTO_INCREMENT,
  `institute_name` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `institute_type` enum('SCHOOL','COLLEGE','UNIVERSITY','INSTITUTE') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `affiliation_type` enum('AFFILIATED','AUTONOMOUS','DEEMED') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `governing_body` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `established_year` smallint DEFAULT NULL,
  `institute_status` enum('ACTIVE','INACTIVE') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`institute_id`),
  KEY `fk_institute_created_by` (`created_by`),
  KEY `fk_institute_updated_by` (`updated_by`),
  CONSTRAINT `fk_institute_created_by` FOREIGN KEY (`created_by`) REFERENCES `tbl_app_user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_institute_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `tbl_app_user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='CONFIRMED - educational institutes master' |
+-----------------------+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
1 row in set (0.00 sec)

mysql> SHOW CREATE TABLE tbl_member_education;
+----------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| Table                | Create Table                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
+----------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| tbl_member_education | CREATE TABLE `tbl_member_education` (
  `member_education_id` bigint NOT NULL AUTO_INCREMENT COMMENT 'Surrogate PK (no PK in source; added for integrity)',
  `icai_membership_no` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `qualification` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `specialisation` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `qualification_family` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `study_mode` enum('Correspondence','Regular','Distance') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `institution_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `university_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `graduation_year` year DEFAULT NULL,
  `batch_year_from` year DEFAULT NULL,
  `batch_year_to` year DEFAULT NULL,
  `education_status` enum('Valid','Invalid') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`member_education_id`),
  KEY `idx_member_education_member` (`icai_membership_no`),
  KEY `fk_member_education_created_by` (`created_by`),
  KEY `fk_member_education_updated_by` (`updated_by`),
  CONSTRAINT `fk_member_education_created_by` FOREIGN KEY (`created_by`) REFERENCES `tbl_app_user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_member_education_member` FOREIGN KEY (`icai_membership_no`) REFERENCES `tbl_ca_member` (`icai_membership_no`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_member_education_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `tbl_app_user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='CONFIRMED - formal qualifications from ICAI' |
+----------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
1 row in set (0.00 sec)

mysql> SHOW CREATE TABLE tbl_member_emails;
+-------------------+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| Table             | Create Table                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
+-------------------+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| tbl_member_emails | CREATE TABLE `tbl_member_emails` (
  `email_id` bigint NOT NULL AUTO_INCREMENT,
  `icai_membership_no` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_address` varchar(400) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_type` enum('Personal','Company') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_status` enum('Active','Inactive') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Active',
  `email_is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`email_id`),
  KEY `idx_member_emails_member` (`icai_membership_no`),
  KEY `fk_member_emails_created_by` (`created_by`),
  KEY `fk_member_emails_updated_by` (`updated_by`),
  CONSTRAINT `fk_member_emails_created_by` FOREIGN KEY (`created_by`) REFERENCES `tbl_app_user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_member_emails_member` FOREIGN KEY (`icai_membership_no`) REFERENCES `tbl_ca_member` (`icai_membership_no`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_member_emails_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `tbl_app_user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='CONFIRMED - email addresses per member' |
+-------------------+--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
1 row in set (0.00 sec)

mysql> SHOW CREATE TABLE tbl_member_phones;
+-------------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| Table             | Create Table                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
+-------------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| tbl_member_phones | CREATE TABLE `tbl_member_phones` (
  `phone_id` bigint NOT NULL AUTO_INCREMENT,
  `icai_membership_no` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone_country_code` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'e.g. +91',
  `phone_number` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone_number_full` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'code + number',
  `phone_type` enum('Personal','Official') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_whatsapp` tinyint(1) NOT NULL DEFAULT '0',
  `phone_status` enum('Active','Inactive') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Active',
  `phone_is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`phone_id`),
  KEY `idx_member_phones_member` (`icai_membership_no`),
  KEY `fk_member_phones_created_by` (`created_by`),
  KEY `fk_member_phones_updated_by` (`updated_by`),
  CONSTRAINT `fk_member_phones_created_by` FOREIGN KEY (`created_by`) REFERENCES `tbl_app_user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_member_phones_member` FOREIGN KEY (`icai_membership_no`) REFERENCES `tbl_ca_member` (`icai_membership_no`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_member_phones_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `tbl_app_user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='CONFIRMED - phone numbers per member' |
+-------------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
1 row in set (0.00 sec)

mysql> SHOW CREATE TABLE tbl_member_social_profiles;
+----------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| Table                      | Create Table                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
+----------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| tbl_member_social_profiles | CREATE TABLE `tbl_member_social_profiles` (
  `social_id` int NOT NULL AUTO_INCREMENT,
  `icai_membership_no` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `social_platform` enum('Facebook','LinkedIn','Instagram','Twitter') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `social_handle_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `social_media_type` enum('Personal','Official','Generic') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `social_status` enum('Active','Inactive') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`social_id`),
  UNIQUE KEY `uq_social_member_platform` (`icai_membership_no`,`social_platform`),
  KEY `fk_social_created_by` (`created_by`),
  KEY `fk_social_updated_by` (`updated_by`),
  CONSTRAINT `fk_social_created_by` FOREIGN KEY (`created_by`) REFERENCES `tbl_app_user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_social_member` FOREIGN KEY (`icai_membership_no`) REFERENCES `tbl_ca_member` (`icai_membership_no`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_social_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `tbl_app_user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='CONFIRMED - social media links per member' |
+----------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
1 row in set (0.00 sec)

mysql> SHOW CREATE TABLE tbl_org_details;
+-----------------+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| Table           | Create Table                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
+-----------------+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| tbl_org_details | CREATE TABLE `tbl_org_details` (
  `org_id` bigint NOT NULL AUTO_INCREMENT,
  `org_name` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `org_reg_no` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'FRN; mandatory if org_type=CA',
  `org_type` enum('CA','NON_CA') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `org_structure` enum('PARTNERSHIP','SOLE_PROP','LLP','PRIVATE_LTD') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `org_status` enum('ACTIVE','INACTIVE') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`org_id`),
  UNIQUE KEY `uq_org_reg_no` (`org_reg_no`),
  KEY `idx_org_type` (`org_type`),
  KEY `fk_org_created_by` (`created_by`),
  KEY `fk_org_updated_by` (`updated_by`),
  CONSTRAINT `fk_org_created_by` FOREIGN KEY (`created_by`) REFERENCES `tbl_app_user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_org_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `tbl_app_user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='CONFIRMED - organisations (firms/companies)' |
+-----------------+---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
1 row in set (0.00 sec)

mysql> SHOW CREATE TABLE tbl_user_auth;
+---------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| Table         | Create Table                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
+---------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| tbl_user_auth | CREATE TABLE `tbl_user_auth` (
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'bcrypt hash',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_user_auth_user` FOREIGN KEY (`user_id`) REFERENCES `tbl_app_user` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Password hashes - separated from tbl_app_user (CONFIRMED)' |
+---------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
1 row in set (0.00 sec)

mysql> SHOW CREATE TABLE tbl_voter;
+-----------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| Table     | Create Table                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
+-----------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| tbl_voter | CREATE TABLE `tbl_voter` (
  `voter_record_id` bigint NOT NULL AUTO_INCREMENT,
  `election_year` smallint NOT NULL,
  `voter_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ICAI-issued; changes across elections',
  `icai_membership_no` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `voter_region` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `voter_booth_no` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `voter_type` enum('Booth','Postal') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `voter_sub_type` enum('Booth-Region','Booth-Other Region','Postal-Domestic','Postal-Foreign') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `voter_status` enum('Active','Inactive','Blocked') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`voter_record_id`),
  UNIQUE KEY `uq_voter_year_voterid` (`election_year`,`voter_id`),
  KEY `idx_voter_member` (`icai_membership_no`),
  KEY `idx_voter_region` (`voter_region`),
  KEY `idx_voter_type` (`voter_type`),
  KEY `fk_voter_created_by` (`created_by`),
  KEY `fk_voter_updated_by` (`updated_by`),
  CONSTRAINT `fk_voter_created_by` FOREIGN KEY (`created_by`) REFERENCES `tbl_app_user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_voter_member` FOREIGN KEY (`icai_membership_no`) REFERENCES `tbl_ca_member` (`icai_membership_no`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_voter_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `tbl_app_user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='CONFIRMED - per-election voter record' |
+-----------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
1 row in set (0.00 sec)

mysql> SHOW CREATE TABLE tbl_voter_education_history;
+-----------------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| Table                       | Create Table                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
+-----------------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| tbl_voter_education_history | CREATE TABLE `tbl_voter_education_history` (
  `edu_hist_id` bigint NOT NULL AUTO_INCREMENT,
  `voter_record_id` bigint NOT NULL,
  `edu_course_type` enum('CA Course','Articleship','University','Coaching','Other') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `institute_id` bigint DEFAULT NULL COMMENT 'NULL for CA Course / Articleship',
  `org_id` bigint DEFAULT NULL COMMENT 'Articleship firm; NULL otherwise',
  `qualification_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `from_year` year DEFAULT NULL,
  `to_year` year DEFAULT NULL,
  `edu_status` enum('Active','Completed','Unknown') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `principal_voter_id` bigint DEFAULT NULL COMMENT 'Articleship principal (another voter)',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`edu_hist_id`),
  KEY `idx_edu_voter` (`voter_record_id`),
  KEY `idx_edu_institute` (`institute_id`),
  KEY `idx_edu_org` (`org_id`),
  KEY `fk_edu_created_by` (`created_by`),
  KEY `fk_edu_principal` (`principal_voter_id`),
  KEY `fk_edu_updated_by` (`updated_by`),
  CONSTRAINT `fk_edu_created_by` FOREIGN KEY (`created_by`) REFERENCES `tbl_app_user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_edu_institute` FOREIGN KEY (`institute_id`) REFERENCES `tbl_institute_details` (`institute_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_edu_org` FOREIGN KEY (`org_id`) REFERENCES `tbl_org_details` (`org_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_edu_principal` FOREIGN KEY (`principal_voter_id`) REFERENCES `tbl_voter` (`voter_record_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_edu_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `tbl_app_user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_edu_voter` FOREIGN KEY (`voter_record_id`) REFERENCES `tbl_voter` (`voter_record_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='FACT - per-voter education history' |
+-----------------------------+-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
1 row in set (0.00 sec)

mysql> SHOW CREATE TABLE tbl_voter_icai_roles;
+----------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| Table                | Create Table                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
+----------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| tbl_voter_icai_roles | CREATE TABLE `tbl_voter_icai_roles` (
  `role_id` bigint NOT NULL AUTO_INCREMENT,
  `voter_record_id` bigint NOT NULL,
  `role_type` enum('Branch Committee','CPE Speaker','ICAI Committee','Specialization','Other') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role_value` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Position name or specialization text',
  `from_year` year DEFAULT NULL,
  `to_year` year DEFAULT NULL COMMENT 'NULL if ongoing',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`role_id`),
  KEY `idx_roles_voter` (`voter_record_id`),
  KEY `idx_roles_type` (`role_type`),
  KEY `fk_roles_created_by` (`created_by`),
  KEY `fk_roles_updated_by` (`updated_by`),
  CONSTRAINT `fk_roles_created_by` FOREIGN KEY (`created_by`) REFERENCES `tbl_app_user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_roles_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `tbl_app_user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_roles_voter` FOREIGN KEY (`voter_record_id`) REFERENCES `tbl_voter` (`voter_record_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='FACT - ICAI positions/roles held by a voter' |
+----------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
1 row in set (0.00 sec)

mysql> SHOW CREATE TABLE tbl_voter_preference;
+----------------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| Table                | Create Table                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
+----------------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| tbl_voter_preference | CREATE TABLE `tbl_voter_preference` (
  `pref_id` bigint NOT NULL AUTO_INCREMENT,
  `voter_record_id` bigint NOT NULL,
  `preference_tier` enum('p1','p2','p3','p4','un') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'p1=Committed p2=Persuadable p3=Undecided p4=>P3 un=Unassigned',
  `support_status` enum('Confirmed','Lean','Undecided','Opposition','Unknown') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `pvs_score` int DEFAULT NULL COMMENT 'Current predictive voter score 0-1000; NULL until scored',
  `pvs_score_previous` int DEFAULT NULL COMMENT 'CHANGE 1: prior score for momentum/delta. Engine writes this.',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`pref_id`),
  UNIQUE KEY `uq_pref_voter` (`voter_record_id`) COMMENT '1:1 with voter',
  KEY `idx_pref_tier` (`preference_tier`),
  KEY `idx_pref_support` (`support_status`),
  KEY `fk_pref_created_by` (`created_by`),
  KEY `fk_pref_updated_by` (`updated_by`),
  CONSTRAINT `fk_pref_created_by` FOREIGN KEY (`created_by`) REFERENCES `tbl_app_user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_pref_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `tbl_app_user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_pref_voter` FOREIGN KEY (`voter_record_id`) REFERENCES `tbl_voter` (`voter_record_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='FACT - preference, warmth, support, PVS (1:1 with voter)' |
+----------------------+-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
1 row in set (0.00 sec)

mysql> SHOW CREATE TABLE tbl_work_history;
+------------------+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| Table            | Create Table                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
+------------------+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| tbl_work_history | CREATE TABLE `tbl_work_history` (
  `wh_id` bigint NOT NULL AUTO_INCREMENT,
  `voter_record_id` bigint NOT NULL,
  `org_id` bigint NOT NULL,
  `designation` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `from_year` year NOT NULL,
  `to_year` year DEFAULT NULL COMMENT 'NULL when is_current = TRUE',
  `is_current` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'only one TRUE per voter (enforced in app)',
  `work_type` enum('Employment','Articleship','Practice') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `work_status` enum('Active','Completed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`wh_id`),
  KEY `idx_work_voter` (`voter_record_id`),
  KEY `idx_work_org` (`org_id`),
  KEY `fk_work_created_by` (`created_by`),
  KEY `fk_work_updated_by` (`updated_by`),
  CONSTRAINT `fk_work_created_by` FOREIGN KEY (`created_by`) REFERENCES `tbl_app_user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_work_org` FOREIGN KEY (`org_id`) REFERENCES `tbl_org_details` (`org_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_work_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `tbl_app_user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_work_voter` FOREIGN KEY (`voter_record_id`) REFERENCES `tbl_voter` (`voter_record_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='FACT - employment timeline per voter' |
+------------------+----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
1 row in set (0.00 sec)

mysql> SHOW INDEX FROM tbl_activity;
+--------------+------------+-------------------------+--------------+---------------+-----------+-------------+----------+--------+------+------------+---------+---------------+---------+------------+
| Table        | Non_unique | Key_name                | Seq_in_index | Column_name   | Collation | Cardinality | Sub_part | Packed | Null | Index_type | Comment | Index_comment | Visible | Expression |
+--------------+------------+-------------------------+--------------+---------------+-----------+-------------+----------+--------+------+------------+---------+---------------+---------+------------+
| tbl_activity |          0 | PRIMARY                 |            1 | activity_id   | A         |           0 |     NULL |   NULL |      | BTREE      |         |               | YES     | NULL       |
| tbl_activity |          1 | idx_activity_date       |            1 | activity_date | A         |           0 |     NULL |   NULL |      | BTREE      |         |               | YES     | NULL       |
| tbl_activity |          1 | idx_activity_type       |            1 | activity_type | A         |           0 |     NULL |   NULL |      | BTREE      |         |               | YES     | NULL       |
| tbl_activity |          1 | fk_activity_assigned_to |            1 | assigned_to   | A         |           0 |     NULL |   NULL | YES  | BTREE      |         |               | YES     | NULL       |
| tbl_activity |          1 | fk_activity_created_by  |            1 | created_by    | A         |           0 |     NULL |   NULL | YES  | BTREE      |         |               | YES     | NULL       |
| tbl_activity |          1 | fk_activity_updated_by  |            1 | updated_by    | A         |           0 |     NULL |   NULL | YES  | BTREE      |         |               | YES     | NULL       |
+--------------+------------+-------------------------+--------------+---------------+-----------+-------------+----------+--------+------+------------+---------+---------------+---------+------------+
6 rows in set (0.08 sec)

mysql> SHOW INDEX FROM tbl_activity_participant;
+--------------------------+------------+-------------------------+--------------+-----------------+-----------+-------------+----------+--------+------+------------+---------+---------------+---------+------------+
| Table                    | Non_unique | Key_name                | Seq_in_index | Column_name     | Collation | Cardinality | Sub_part | Packed | Null | Index_type | Comment | Index_comment | Visible | Expression |
+--------------------------+------------+-------------------------+--------------+-----------------+-----------+-------------+----------+--------+------+------------+---------+---------------+---------+------------+
| tbl_activity_participant |          0 | PRIMARY                 |            1 | ap_id           | A         |           0 |     NULL |   NULL |      | BTREE      |         |               | YES     | NULL       |
| tbl_activity_participant |          0 | uq_activity_participant |            1 | activity_id     | A         |           0 |     NULL |   NULL |      | BTREE      |         |               | YES     | NULL       |
| tbl_activity_participant |          0 | uq_activity_participant |            2 | voter_record_id | A         |           0 |     NULL |   NULL |      | BTREE      |         |               | YES     | NULL       |
| tbl_activity_participant |          1 | idx_ap_voter            |            1 | voter_record_id | A         |           0 |     NULL |   NULL |      | BTREE      |         |               | YES     | NULL       |
| tbl_activity_participant |          1 | fk_ap_created_by        |            1 | created_by      | A         |           0 |     NULL |   NULL | YES  | BTREE      |         |               | YES     | NULL       |
| tbl_activity_participant |          1 | fk_ap_updated_by        |            1 | updated_by      | A         |           0 |     NULL |   NULL | YES  | BTREE      |         |               | YES     | NULL       |
+--------------------------+------------+-------------------------+--------------+-----------------+-----------+-------------+----------+--------+------+------------+---------+---------------+---------+------------+
6 rows in set (0.01 sec)

mysql> SHOW INDEX FROM tbl_app_user;
+--------------+------------+------------------------+--------------+-------------+-----------+-------------+----------+--------+------+------------+---------+---------------+---------+------------+
| Table        | Non_unique | Key_name               | Seq_in_index | Column_name | Collation | Cardinality | Sub_part | Packed | Null | Index_type | Comment | Index_comment | Visible | Expression |
+--------------+------------+------------------------+--------------+-------------+-----------+-------------+----------+--------+------+------------+---------+---------------+---------+------------+
| tbl_app_user |          0 | PRIMARY                |            1 | user_id     | A         |           0 |     NULL |   NULL |      | BTREE      |         |               | YES     | NULL       |
| tbl_app_user |          0 | uq_app_user_email      |            1 | email       | A         |           0 |     NULL |   NULL |      | BTREE      |         |               | YES     | NULL       |
| tbl_app_user |          1 | fk_app_user_created_by |            1 | created_by  | A         |           0 |     NULL |   NULL | YES  | BTREE      |         |               | YES     | NULL       |
| tbl_app_user |          1 | fk_app_user_updated_by |            1 | updated_by  | A         |           0 |     NULL |   NULL | YES  | BTREE      |         |               | YES     | NULL       |
+--------------+------------+------------------------+--------------+-------------+-----------+-------------+----------+--------+------+------------+---------+---------------+---------+------------+
4 rows in set (0.01 sec)

mysql> SHOW INDEX FROM tbl_ca_member;
+---------------+------------+-------------------------+--------------+--------------------+-----------+-------------+----------+--------+------+------------+---------+---------------+---------+------------+
| Table         | Non_unique | Key_name                | Seq_in_index | Column_name        | Collation | Cardinality | Sub_part | Packed | Null | Index_type | Comment | Index_comment | Visible | Expression |
+---------------+------------+-------------------------+--------------+--------------------+-----------+-------------+----------+--------+------+------------+---------+---------------+---------+------------+
| tbl_ca_member |          0 | PRIMARY                 |            1 | icai_membership_no | A         |           1 |     NULL |   NULL |      | BTREE      |         |               | YES     | NULL       |
| tbl_ca_member |          1 | idx_ca_member_region    |            1 | member_region_base | A         |           1 |     NULL |   NULL |      | BTREE      |         |               | YES     | NULL       |
| tbl_ca_member |          1 | idx_ca_member_status    |            1 | member_status      | A         |           1 |     NULL |   NULL |      | BTREE      |         |               | YES     | NULL       |
| tbl_ca_member |          1 | fk_ca_member_created_by |            1 | created_by         | A         |           1 |     NULL |   NULL | YES  | BTREE      |         |               | YES     | NULL       |
| tbl_ca_member |          1 | fk_ca_member_updated_by |            1 | updated_by         | A         |           1 |     NULL |   NULL | YES  | BTREE      |         |               | YES     | NULL       |
+---------------+------------+-------------------------+--------------+--------------------+-----------+-------------+----------+--------+------+------------+---------+---------------+---------+------------+
5 rows in set (0.01 sec)

mysql> SHOW INDEX FROM tbl_ca_member_fact;
+--------------------+------------+---------------------------+--------------+--------------------+-----------+-------------+----------+--------+------+------------+---------+---------------+---------+------------+
| Table              | Non_unique | Key_name                  | Seq_in_index | Column_name        | Collation | Cardinality | Sub_part | Packed | Null | Index_type | Comment | Index_comment | Visible | Expression |
+--------------------+------------+---------------------------+--------------+--------------------+-----------+-------------+----------+--------+------+------------+---------+---------------+---------+------------+
| tbl_ca_member_fact |          0 | PRIMARY                   |            1 | icai_membership_no | A         |           1 |     NULL |   NULL |      | BTREE      |         |               | YES     | NULL       |
| tbl_ca_member_fact |          1 | fk_member_fact_created_by |            1 | created_by         | A         |           1 |     NULL |   NULL | YES  | BTREE      |         |               | YES     | NULL       |
| tbl_ca_member_fact |          1 | fk_member_fact_updated_by |            1 | updated_by         | A         |           1 |     NULL |   NULL | YES  | BTREE      |         |               | YES     | NULL       |
+--------------------+------------+---------------------------+--------------+--------------------+-----------+-------------+----------+--------+------+------------+---------+---------------+---------+------------+
3 rows in set (0.01 sec)

mysql> SHOW INDEX FROM tbl_campaign_goal;
+-------------------+------------+--------------------+--------------+---------------+-----------+-------------+----------+--------+------+------------+---------+---------------+---------+------------+
| Table             | Non_unique | Key_name           | Seq_in_index | Column_name   | Collation | Cardinality | Sub_part | Packed | Null | Index_type | Comment | Index_comment | Visible | Expression |
+-------------------+------------+--------------------+--------------+---------------+-----------+-------------+----------+--------+------+------------+---------+---------------+---------+------------+
| tbl_campaign_goal |          0 | PRIMARY            |            1 | goal_id       | A         |           1 |     NULL |   NULL |      | BTREE      |         |               | YES     | NULL       |
| tbl_campaign_goal |          1 | idx_goal_year      |            1 | election_year | A         |           1 |     NULL |   NULL |      | BTREE      |         |               | YES     | NULL       |
| tbl_campaign_goal |          1 | idx_goal_created   |            1 | created_at    | A         |           1 |     NULL |   NULL |      | BTREE      |         |               | YES     | NULL       |
| tbl_campaign_goal |          1 | fk_goal_created_by |            1 | created_by    | A         |           1 |     NULL |   NULL | YES  | BTREE      |         |               | YES     | NULL       |
+-------------------+------------+--------------------+--------------+---------------+-----------+-------------+----------+--------+------+------------+---------+---------------+---------+------------+
4 rows in set (0.01 sec)

mysql> SHOW INDEX FROM tbl_dnd;
+---------+------------+-------------------+--------------+-----------------+-----------+-------------+----------+--------+------+------------+---------+------------------------------+---------+------------+
| Table   | Non_unique | Key_name          | Seq_in_index | Column_name     | Collation | Cardinality | Sub_part | Packed | Null | Index_type | Comment | Index_comment                | Visible | Expression |
+---------+------------+-------------------+--------------+-----------------+-----------+-------------+----------+--------+------+------------+---------+------------------------------+---------+------------+
| tbl_dnd |          0 | PRIMARY           |            1 | dnd_id          | A         |           0 |     NULL |   NULL |      | BTREE      |         |                              | YES     | NULL       |
| tbl_dnd |          0 | uq_dnd_voter      |            1 | voter_record_id | A         |           0 |     NULL |   NULL |      | BTREE      |         | one active DND row per voter | YES     | NULL       |
| tbl_dnd |          1 | fk_dnd_created_by |            1 | created_by      | A         |           0 |     NULL |   NULL | YES  | BTREE      |         |                              | YES     | NULL       |
| tbl_dnd |          1 | fk_dnd_removed_by |            1 | removed_by      | A         |           0 |     NULL |   NULL | YES  | BTREE      |         |                              | YES     | NULL       |
| tbl_dnd |          1 | fk_dnd_updated_by |            1 | updated_by      | A         |           0 |     NULL |   NULL | YES  | BTREE      |         |                              | YES     | NULL       |
+---------+------------+-------------------+--------------+-----------------+-----------+-------------+----------+--------+------+------------+---------+------------------------------+---------+------------+
5 rows in set (0.01 sec)

mysql> SHOW INDEX FROM tbl_institute_details;
+-----------------------+------------+-------------------------+--------------+--------------+-----------+-------------+----------+--------+------+------------+---------+---------------+---------+------------+
| Table                 | Non_unique | Key_name                | Seq_in_index | Column_name  | Collation | Cardinality | Sub_part | Packed | Null | Index_type | Comment | Index_comment | Visible | Expression |
+-----------------------+------------+-------------------------+--------------+--------------+-----------+-------------+----------+--------+------+------------+---------+---------------+---------+------------+
| tbl_institute_details |          0 | PRIMARY                 |            1 | institute_id | A         |           0 |     NULL |   NULL |      | BTREE      |         |               | YES     | NULL       |
| tbl_institute_details |          1 | fk_institute_created_by |            1 | created_by   | A         |           0 |     NULL |   NULL | YES  | BTREE      |         |               | YES     | NULL       |
| tbl_institute_details |          1 | fk_institute_updated_by |            1 | updated_by   | A         |           0 |     NULL |   NULL | YES  | BTREE      |         |               | YES     | NULL       |
+-----------------------+------------+-------------------------+--------------+--------------+-----------+-------------+----------+--------+------+------------+---------+---------------+---------+------------+
3 rows in set (0.01 sec)

mysql> SHOW INDEX FROM tbl_member_education;
+----------------------+------------+--------------------------------+--------------+---------------------+-----------+-------------+----------+--------+------+------------+---------+---------------+---------+------------+
| Table                | Non_unique | Key_name                       | Seq_in_index | Column_name         | Collation | Cardinality | Sub_part | Packed | Null | Index_type | Comment | Index_comment | Visible | Expression |
+----------------------+------------+--------------------------------+--------------+---------------------+-----------+-------------+----------+--------+------+------------+---------+---------------+---------+------------+
| tbl_member_education |          0 | PRIMARY                        |            1 | member_education_id | A         |           0 |     NULL |   NULL |      | BTREE      |         |               | YES     | NULL       |
| tbl_member_education |          1 | idx_member_education_member    |            1 | icai_membership_no  | A         |           0 |     NULL |   NULL |      | BTREE      |         |               | YES     | NULL       |
| tbl_member_education |          1 | fk_member_education_created_by |            1 | created_by          | A         |           0 |     NULL |   NULL | YES  | BTREE      |         |               | YES     | NULL       |
| tbl_member_education |          1 | fk_member_education_updated_by |            1 | updated_by          | A         |           0 |     NULL |   NULL | YES  | BTREE      |         |               | YES     | NULL       |
+----------------------+------------+--------------------------------+--------------+---------------------+-----------+-------------+----------+--------+------+------------+---------+---------------+---------+------------+
4 rows in set (0.01 sec)

mysql> SHOW INDEX FROM tbl_member_emails;
+-------------------+------------+-----------------------------+--------------+--------------------+-----------+-------------+----------+--------+------+------------+---------+---------------+---------+------------+
| Table             | Non_unique | Key_name                    | Seq_in_index | Column_name        | Collation | Cardinality | Sub_part | Packed | Null | Index_type | Comment | Index_comment | Visible | Expression |
+-------------------+------------+-----------------------------+--------------+--------------------+-----------+-------------+----------+--------+------+------------+---------+---------------+---------+------------+
| tbl_member_emails |          0 | PRIMARY                     |            1 | email_id           | A         |           0 |     NULL |   NULL |      | BTREE      |         |               | YES     | NULL       |
| tbl_member_emails |          1 | idx_member_emails_member    |            1 | icai_membership_no | A         |           0 |     NULL |   NULL |      | BTREE      |         |               | YES     | NULL       |
| tbl_member_emails |          1 | fk_member_emails_created_by |            1 | created_by         | A         |           0 |     NULL |   NULL | YES  | BTREE      |         |               | YES     | NULL       |
| tbl_member_emails |          1 | fk_member_emails_updated_by |            1 | updated_by         | A         |           0 |     NULL |   NULL | YES  | BTREE      |         |               | YES     | NULL       |
+-------------------+------------+-----------------------------+--------------+--------------------+-----------+-------------+----------+--------+------+------------+---------+---------------+---------+------------+
4 rows in set (0.01 sec)

mysql> SHOW INDEX FROM tbl_member_phones;
+-------------------+------------+-----------------------------+--------------+--------------------+-----------+-------------+----------+--------+------+------------+---------+---------------+---------+------------+
| Table             | Non_unique | Key_name                    | Seq_in_index | Column_name        | Collation | Cardinality | Sub_part | Packed | Null | Index_type | Comment | Index_comment | Visible | Expression |
+-------------------+------------+-----------------------------+--------------+--------------------+-----------+-------------+----------+--------+------+------------+---------+---------------+---------+------------+
| tbl_member_phones |          0 | PRIMARY                     |            1 | phone_id           | A         |           0 |     NULL |   NULL |      | BTREE      |         |               | YES     | NULL       |
| tbl_member_phones |          1 | idx_member_phones_member    |            1 | icai_membership_no | A         |           0 |     NULL |   NULL |      | BTREE      |         |               | YES     | NULL       |
| tbl_member_phones |          1 | fk_member_phones_created_by |            1 | created_by         | A         |           0 |     NULL |   NULL | YES  | BTREE      |         |               | YES     | NULL       |
| tbl_member_phones |          1 | fk_member_phones_updated_by |            1 | updated_by         | A         |           0 |     NULL |   NULL | YES  | BTREE      |         |               | YES     | NULL       |
+-------------------+------------+-----------------------------+--------------+--------------------+-----------+-------------+----------+--------+------+------------+---------+---------------+---------+------------+
4 rows in set (0.01 sec)

mysql> SHOW INDEX FROM tbl_member_social_profiles;
+----------------------------+------------+---------------------------+--------------+--------------------+-----------+-------------+----------+--------+------+------------+---------+---------------+---------+------------+
| Table                      | Non_unique | Key_name                  | Seq_in_index | Column_name        | Collation | Cardinality | Sub_part | Packed | Null | Index_type | Comment | Index_comment | Visible | Expression |
+----------------------------+------------+---------------------------+--------------+--------------------+-----------+-------------+----------+--------+------+------------+---------+---------------+---------+------------+
| tbl_member_social_profiles |          0 | PRIMARY                   |            1 | social_id          | A         |           0 |     NULL |   NULL |      | BTREE      |         |               | YES     | NULL       |
| tbl_member_social_profiles |          0 | uq_social_member_platform |            1 | icai_membership_no | A         |           0 |     NULL |   NULL |      | BTREE      |         |               | YES     | NULL       |
| tbl_member_social_profiles |          0 | uq_social_member_platform |            2 | social_platform    | A         |           0 |     NULL |   NULL | YES  | BTREE      |         |               | YES     | NULL       |
| tbl_member_social_profiles |          1 | fk_social_created_by      |            1 | created_by         | A         |           0 |     NULL |   NULL | YES  | BTREE      |         |               | YES     | NULL       |
| tbl_member_social_profiles |          1 | fk_social_updated_by      |            1 | updated_by         | A         |           0 |     NULL |   NULL | YES  | BTREE      |         |               | YES     | NULL       |
+----------------------------+------------+---------------------------+--------------+--------------------+-----------+-------------+----------+--------+------+------------+---------+---------------+---------+------------+
5 rows in set (0.01 sec)

mysql> SHOW INDEX FROM tbl_org_details;
+-----------------+------------+-------------------+--------------+-------------+-----------+-------------+----------+--------+------+------------+---------+---------------+---------+------------+
| Table           | Non_unique | Key_name          | Seq_in_index | Column_name | Collation | Cardinality | Sub_part | Packed | Null | Index_type | Comment | Index_comment | Visible | Expression |
+-----------------+------------+-------------------+--------------+-------------+-----------+-------------+----------+--------+------+------------+---------+---------------+---------+------------+
| tbl_org_details |          0 | PRIMARY           |            1 | org_id      | A         |           0 |     NULL |   NULL |      | BTREE      |         |               | YES     | NULL       |
| tbl_org_details |          0 | uq_org_reg_no     |            1 | org_reg_no  | A         |           0 |     NULL |   NULL | YES  | BTREE      |         |               | YES     | NULL       |
| tbl_org_details |          1 | idx_org_type      |            1 | org_type    | A         |           0 |     NULL |   NULL |      | BTREE      |         |               | YES     | NULL       |
| tbl_org_details |          1 | fk_org_created_by |            1 | created_by  | A         |           0 |     NULL |   NULL | YES  | BTREE      |         |               | YES     | NULL       |
| tbl_org_details |          1 | fk_org_updated_by |            1 | updated_by  | A         |           0 |     NULL |   NULL | YES  | BTREE      |         |               | YES     | NULL       |
+-----------------+------------+-------------------+--------------+-------------+-----------+-------------+----------+--------+------+------------+---------+---------------+---------+------------+
5 rows in set (0.01 sec)

mysql> SHOW INDEX FROM tbl_user_auth;
+---------------+------------+----------+--------------+-------------+-----------+-------------+----------+--------+------+------------+---------+---------------+---------+------------+
| Table         | Non_unique | Key_name | Seq_in_index | Column_name | Collation | Cardinality | Sub_part | Packed | Null | Index_type | Comment | Index_comment | Visible | Expression |
+---------------+------------+----------+--------------+-------------+-----------+-------------+----------+--------+------+------------+---------+---------------+---------+------------+
| tbl_user_auth |          0 | PRIMARY  |            1 | user_id     | A         |           1 |     NULL |   NULL |      | BTREE      |         |               | YES     | NULL       |
+---------------+------------+----------+--------------+-------------+-----------+-------------+----------+--------+------+------------+---------+---------------+---------+------------+
1 row in set (0.00 sec)

mysql> SHOW INDEX FROM tbl_voter;
+-----------+------------+-----------------------+--------------+--------------------+-----------+-------------+----------+--------+------+------------+---------+---------------+---------+------------+
| Table     | Non_unique | Key_name              | Seq_in_index | Column_name        | Collation | Cardinality | Sub_part | Packed | Null | Index_type | Comment | Index_comment | Visible | Expression |
+-----------+------------+-----------------------+--------------+--------------------+-----------+-------------+----------+--------+------+------------+---------+---------------+---------+------------+
| tbl_voter |          0 | PRIMARY               |            1 | voter_record_id    | A         |           1 |     NULL |   NULL |      | BTREE      |         |               | YES     | NULL       |
| tbl_voter |          0 | uq_voter_year_voterid |            1 | election_year      | A         |           1 |     NULL |   NULL |      | BTREE      |         |               | YES     | NULL       |
| tbl_voter |          0 | uq_voter_year_voterid |            2 | voter_id           | A         |           1 |     NULL |   NULL |      | BTREE      |         |               | YES     | NULL       |
| tbl_voter |          1 | idx_voter_member      |            1 | icai_membership_no | A         |           1 |     NULL |   NULL |      | BTREE      |         |               | YES     | NULL       |
| tbl_voter |          1 | idx_voter_region      |            1 | voter_region       | A         |           1 |     NULL |   NULL |      | BTREE      |         |               | YES     | NULL       |
| tbl_voter |          1 | idx_voter_type        |            1 | voter_type         | A         |           1 |     NULL |   NULL |      | BTREE      |         |               | YES     | NULL       |
| tbl_voter |          1 | fk_voter_created_by   |            1 | created_by         | A         |           1 |     NULL |   NULL | YES  | BTREE      |         |               | YES     | NULL       |
| tbl_voter |          1 | fk_voter_updated_by   |            1 | updated_by         | A         |           1 |     NULL |   NULL | YES  | BTREE      |         |               | YES     | NULL       |
+-----------+------------+-----------------------+--------------+--------------------+-----------+-------------+----------+--------+------+------------+---------+---------------+---------+------------+
8 rows in set (0.01 sec)

mysql> SHOW INDEX FROM tbl_voter_education_history;
+-----------------------------+------------+-------------------+--------------+--------------------+-----------+-------------+----------+--------+------+------------+---------+---------------+---------+------------+
| Table                       | Non_unique | Key_name          | Seq_in_index | Column_name        | Collation | Cardinality | Sub_part | Packed | Null | Index_type | Comment | Index_comment | Visible | Expression |
+-----------------------------+------------+-------------------+--------------+--------------------+-----------+-------------+----------+--------+------+------------+---------+---------------+---------+------------+
| tbl_voter_education_history |          0 | PRIMARY           |            1 | edu_hist_id        | A         |           0 |     NULL |   NULL |      | BTREE      |         |               | YES     | NULL       |
| tbl_voter_education_history |          1 | idx_edu_voter     |            1 | voter_record_id    | A         |           0 |     NULL |   NULL |      | BTREE      |         |               | YES     | NULL       |
| tbl_voter_education_history |          1 | idx_edu_institute |            1 | institute_id       | A         |           0 |     NULL |   NULL | YES  | BTREE      |         |               | YES     | NULL       |
| tbl_voter_education_history |          1 | idx_edu_org       |            1 | org_id             | A         |           0 |     NULL |   NULL | YES  | BTREE      |         |               | YES     | NULL       |
| tbl_voter_education_history |          1 | fk_edu_created_by |            1 | created_by         | A         |           0 |     NULL |   NULL | YES  | BTREE      |         |               | YES     | NULL       |
| tbl_voter_education_history |          1 | fk_edu_principal  |            1 | principal_voter_id | A         |           0 |     NULL |   NULL | YES  | BTREE      |         |               | YES     | NULL       |
| tbl_voter_education_history |          1 | fk_edu_updated_by |            1 | updated_by         | A         |           0 |     NULL |   NULL | YES  | BTREE      |         |               | YES     | NULL       |
+-----------------------------+------------+-------------------+--------------+--------------------+-----------+-------------+----------+--------+------+------------+---------+---------------+---------+------------+
7 rows in set (0.01 sec)

mysql> SHOW INDEX FROM tbl_voter_icai_roles;
+----------------------+------------+---------------------+--------------+-----------------+-----------+-------------+----------+--------+------+------------+---------+---------------+---------+------------+
| Table                | Non_unique | Key_name            | Seq_in_index | Column_name     | Collation | Cardinality | Sub_part | Packed | Null | Index_type | Comment | Index_comment | Visible | Expression |
+----------------------+------------+---------------------+--------------+-----------------+-----------+-------------+----------+--------+------+------------+---------+---------------+---------+------------+
| tbl_voter_icai_roles |          0 | PRIMARY             |            1 | role_id         | A         |           0 |     NULL |   NULL |      | BTREE      |         |               | YES     | NULL       |
| tbl_voter_icai_roles |          1 | idx_roles_voter     |            1 | voter_record_id | A         |           0 |     NULL |   NULL |      | BTREE      |         |               | YES     | NULL       |
| tbl_voter_icai_roles |          1 | idx_roles_type      |            1 | role_type       | A         |           0 |     NULL |   NULL |      | BTREE      |         |               | YES     | NULL       |
| tbl_voter_icai_roles |          1 | fk_roles_created_by |            1 | created_by      | A         |           0 |     NULL |   NULL | YES  | BTREE      |         |               | YES     | NULL       |
| tbl_voter_icai_roles |          1 | fk_roles_updated_by |            1 | updated_by      | A         |           0 |     NULL |   NULL | YES  | BTREE      |         |               | YES     | NULL       |
+----------------------+------------+---------------------+--------------+-----------------+-----------+-------------+----------+--------+------+------------+---------+---------------+---------+------------+
5 rows in set (0.01 sec)

mysql> SHOW INDEX FROM tbl_voter_preference;
+----------------------+------------+--------------------+--------------+-----------------+-----------+-------------+----------+--------+------+------------+---------+----------------+---------+------------+
| Table                | Non_unique | Key_name           | Seq_in_index | Column_name     | Collation | Cardinality | Sub_part | Packed | Null | Index_type | Comment | Index_comment  | Visible | Expression |
+----------------------+------------+--------------------+--------------+-----------------+-----------+-------------+----------+--------+------+------------+---------+----------------+---------+------------+
| tbl_voter_preference |          0 | PRIMARY            |            1 | pref_id         | A         |           1 |     NULL |   NULL |      | BTREE      |         |                | YES     | NULL       |
| tbl_voter_preference |          0 | uq_pref_voter      |            1 | voter_record_id | A         |           1 |     NULL |   NULL |      | BTREE      |         | 1:1 with voter | YES     | NULL       |
| tbl_voter_preference |          1 | idx_pref_tier      |            1 | preference_tier | A         |           1 |     NULL |   NULL |      | BTREE      |         |                | YES     | NULL       |
| tbl_voter_preference |          1 | idx_pref_support   |            1 | support_status  | A         |           1 |     NULL |   NULL |      | BTREE      |         |                | YES     | NULL       |
| tbl_voter_preference |          1 | fk_pref_created_by |            1 | created_by      | A         |           1 |     NULL |   NULL | YES  | BTREE      |         |                | YES     | NULL       |
| tbl_voter_preference |          1 | fk_pref_updated_by |            1 | updated_by      | A         |           1 |     NULL |   NULL | YES  | BTREE      |         |                | YES     | NULL       |
+----------------------+------------+--------------------+--------------+-----------------+-----------+-------------+----------+--------+------+------------+---------+----------------+---------+------------+
6 rows in set (0.01 sec)

mysql> SHOW INDEX FROM tbl_work_history;
+------------------+------------+--------------------+--------------+-----------------+-----------+-------------+----------+--------+------+------------+---------+---------------+---------+------------+
| Table            | Non_unique | Key_name           | Seq_in_index | Column_name     | Collation | Cardinality | Sub_part | Packed | Null | Index_type | Comment | Index_comment | Visible | Expression |
+------------------+------------+--------------------+--------------+-----------------+-----------+-------------+----------+--------+------+------------+---------+---------------+---------+------------+
| tbl_work_history |          0 | PRIMARY            |            1 | wh_id           | A         |           0 |     NULL |   NULL |      | BTREE      |         |               | YES     | NULL       |
| tbl_work_history |          1 | idx_work_voter     |            1 | voter_record_id | A         |           0 |     NULL |   NULL |      | BTREE      |         |               | YES     | NULL       |
| tbl_work_history |          1 | idx_work_org       |            1 | org_id          | A         |           0 |     NULL |   NULL |      | BTREE      |         |               | YES     | NULL       |
| tbl_work_history |          1 | fk_work_created_by |            1 | created_by      | A         |           0 |     NULL |   NULL | YES  | BTREE      |         |               | YES     | NULL       |
| tbl_work_history |          1 | fk_work_updated_by |            1 | updated_by      | A         |           0 |     NULL |   NULL | YES  | BTREE      |         |               | YES     | NULL       |
+------------------+------------+--------------------+--------------+-----------------+-----------+-------------+----------+--------+------+------------+---------+---------------+---------+------------+
5 rows in set (0.01 sec)

mysql> SHOW TRIGGERS FROM relateme;
Empty set (0.01 sec)

mysql> SELECT
    ->     TABLE_NAME,
    ->     COLUMN_NAME,
    ->     CONSTRAINT_NAME,
    ->     REFERENCED_TABLE_NAME,
    ->     REFERENCED_COLUMN_NAME
    -> FROM information_schema.KEY_COLUMN_USAGE
    -> WHERE TABLE_SCHEMA = 'relateme'
    -> AND REFERENCED_TABLE_NAME IS NOT NULL
    -> ORDER BY TABLE_NAME, COLUMN_NAME;
+-----------------------------+--------------------+--------------------------------+-----------------------+------------------------+
| TABLE_NAME                  | COLUMN_NAME        | CONSTRAINT_NAME                | REFERENCED_TABLE_NAME | REFERENCED_COLUMN_NAME |
+-----------------------------+--------------------+--------------------------------+-----------------------+------------------------+
| tbl_activity                | assigned_to        | fk_activity_assigned_to        | tbl_app_user          | user_id                |
| tbl_activity                | created_by         | fk_activity_created_by         | tbl_app_user          | user_id                |
| tbl_activity                | updated_by         | fk_activity_updated_by         | tbl_app_user          | user_id                |
| tbl_activity_participant    | activity_id        | fk_ap_activity                 | tbl_activity          | activity_id            |
| tbl_activity_participant    | created_by         | fk_ap_created_by               | tbl_app_user          | user_id                |
| tbl_activity_participant    | updated_by         | fk_ap_updated_by               | tbl_app_user          | user_id                |
| tbl_activity_participant    | voter_record_id    | fk_ap_voter                    | tbl_voter             | voter_record_id        |
| tbl_app_user                | created_by         | fk_app_user_created_by         | tbl_app_user          | user_id                |
| tbl_app_user                | updated_by         | fk_app_user_updated_by         | tbl_app_user          | user_id                |
| tbl_ca_member               | created_by         | fk_ca_member_created_by        | tbl_app_user          | user_id                |
| tbl_ca_member               | updated_by         | fk_ca_member_updated_by        | tbl_app_user          | user_id                |
| tbl_ca_member_fact          | created_by         | fk_member_fact_created_by      | tbl_app_user          | user_id                |
| tbl_ca_member_fact          | icai_membership_no | fk_member_fact_member          | tbl_ca_member         | icai_membership_no     |
| tbl_ca_member_fact          | updated_by         | fk_member_fact_updated_by      | tbl_app_user          | user_id                |
| tbl_campaign_goal           | created_by         | fk_goal_created_by             | tbl_app_user          | user_id                |
| tbl_dnd                     | created_by         | fk_dnd_created_by              | tbl_app_user          | user_id                |
| tbl_dnd                     | removed_by         | fk_dnd_removed_by              | tbl_app_user          | user_id                |
| tbl_dnd                     | updated_by         | fk_dnd_updated_by              | tbl_app_user          | user_id                |
| tbl_dnd                     | voter_record_id    | fk_dnd_voter                   | tbl_voter             | voter_record_id        |
| tbl_institute_details       | created_by         | fk_institute_created_by        | tbl_app_user          | user_id                |
| tbl_institute_details       | updated_by         | fk_institute_updated_by        | tbl_app_user          | user_id                |
| tbl_member_education        | created_by         | fk_member_education_created_by | tbl_app_user          | user_id                |
| tbl_member_education        | icai_membership_no | fk_member_education_member     | tbl_ca_member         | icai_membership_no     |
| tbl_member_education        | updated_by         | fk_member_education_updated_by | tbl_app_user          | user_id                |
| tbl_member_emails           | created_by         | fk_member_emails_created_by    | tbl_app_user          | user_id                |
| tbl_member_emails           | icai_membership_no | fk_member_emails_member        | tbl_ca_member         | icai_membership_no     |
| tbl_member_emails           | updated_by         | fk_member_emails_updated_by    | tbl_app_user          | user_id                |
| tbl_member_phones           | created_by         | fk_member_phones_created_by    | tbl_app_user          | user_id                |
| tbl_member_phones           | icai_membership_no | fk_member_phones_member        | tbl_ca_member         | icai_membership_no     |
| tbl_member_phones           | updated_by         | fk_member_phones_updated_by    | tbl_app_user          | user_id                |
| tbl_member_social_profiles  | created_by         | fk_social_created_by           | tbl_app_user          | user_id                |
| tbl_member_social_profiles  | icai_membership_no | fk_social_member               | tbl_ca_member         | icai_membership_no     |
| tbl_member_social_profiles  | updated_by         | fk_social_updated_by           | tbl_app_user          | user_id                |
| tbl_org_details             | created_by         | fk_org_created_by              | tbl_app_user          | user_id                |
| tbl_org_details             | updated_by         | fk_org_updated_by              | tbl_app_user          | user_id                |
| tbl_user_auth               | user_id            | fk_user_auth_user              | tbl_app_user          | user_id                |
| tbl_voter                   | created_by         | fk_voter_created_by            | tbl_app_user          | user_id                |
| tbl_voter                   | icai_membership_no | fk_voter_member                | tbl_ca_member         | icai_membership_no     |
| tbl_voter                   | updated_by         | fk_voter_updated_by            | tbl_app_user          | user_id                |
| tbl_voter_education_history | created_by         | fk_edu_created_by              | tbl_app_user          | user_id                |
| tbl_voter_education_history | institute_id       | fk_edu_institute               | tbl_institute_details | institute_id           |
| tbl_voter_education_history | org_id             | fk_edu_org                     | tbl_org_details       | org_id                 |
| tbl_voter_education_history | principal_voter_id | fk_edu_principal               | tbl_voter             | voter_record_id        |
| tbl_voter_education_history | updated_by         | fk_edu_updated_by              | tbl_app_user          | user_id                |
| tbl_voter_education_history | voter_record_id    | fk_edu_voter                   | tbl_voter             | voter_record_id        |
| tbl_voter_icai_roles        | created_by         | fk_roles_created_by            | tbl_app_user          | user_id                |
| tbl_voter_icai_roles        | updated_by         | fk_roles_updated_by            | tbl_app_user          | user_id                |
| tbl_voter_icai_roles        | voter_record_id    | fk_roles_voter                 | tbl_voter             | voter_record_id        |
| tbl_voter_preference        | created_by         | fk_pref_created_by             | tbl_app_user          | user_id                |
| tbl_voter_preference        | updated_by         | fk_pref_updated_by             | tbl_app_user          | user_id                |
| tbl_voter_preference        | voter_record_id    | fk_pref_voter                  | tbl_voter             | voter_record_id        |
| tbl_work_history            | created_by         | fk_work_created_by             | tbl_app_user          | user_id                |
| tbl_work_history            | org_id             | fk_work_org                    | tbl_org_details       | org_id                 |
| tbl_work_history            | updated_by         | fk_work_updated_by             | tbl_app_user          | user_id                |
| tbl_work_history            | voter_record_id    | fk_work_voter                  | tbl_voter             | voter_record_id        |
+-----------------------------+--------------------+--------------------------------+-----------------------+------------------------+
55 rows in set (0.03 sec)

mysql> SELECT
    ->     TABLE_NAME,
    ->     COLUMN_NAME
    -> FROM information_schema.KEY_COLUMN_USAGE
    -> WHERE TABLE_SCHEMA = 'relateme'
    -> AND CONSTRAINT_NAME = 'PRIMARY'
    -> ORDER BY TABLE_NAME;
+-----------------------------+---------------------+
| TABLE_NAME                  | COLUMN_NAME         |
+-----------------------------+---------------------+
| tbl_activity                | activity_id         |
| tbl_activity_participant    | ap_id               |
| tbl_app_user                | user_id             |
| tbl_ca_member               | icai_membership_no  |
| tbl_ca_member_fact          | icai_membership_no  |
| tbl_campaign_goal           | goal_id             |
| tbl_dnd                     | dnd_id              |
| tbl_institute_details       | institute_id        |
| tbl_member_education        | member_education_id |
| tbl_member_emails           | email_id            |
| tbl_member_phones           | phone_id            |
| tbl_member_social_profiles  | social_id           |
| tbl_org_details             | org_id              |
| tbl_user_auth               | user_id             |
| tbl_voter                   | voter_record_id     |
| tbl_voter_education_history | edu_hist_id         |
| tbl_voter_icai_roles        | role_id             |
| tbl_voter_preference        | pref_id             |
| tbl_work_history            | wh_id               |
+-----------------------------+---------------------+
19 rows in set (0.01 sec)

mysql> SELECT
    ->     TABLE_NAME,
    ->     CONSTRAINT_NAME,
    ->     CONSTRAINT_TYPE
    -> FROM information_schema.TABLE_CONSTRAINTS
    -> WHERE TABLE_SCHEMA = 'relateme'
    -> ORDER BY TABLE_NAME, CONSTRAINT_TYPE;
+-----------------------------+--------------------------------+-----------------+
| TABLE_NAME                  | CONSTRAINT_NAME                | CONSTRAINT_TYPE |
+-----------------------------+--------------------------------+-----------------+
| tbl_activity                | fk_activity_assigned_to        | FOREIGN KEY     |
| tbl_activity                | fk_activity_created_by         | FOREIGN KEY     |
| tbl_activity                | fk_activity_updated_by         | FOREIGN KEY     |
| tbl_activity                | PRIMARY                        | PRIMARY KEY     |
| tbl_activity_participant    | fk_ap_activity                 | FOREIGN KEY     |
| tbl_activity_participant    | fk_ap_created_by               | FOREIGN KEY     |
| tbl_activity_participant    | fk_ap_updated_by               | FOREIGN KEY     |
| tbl_activity_participant    | fk_ap_voter                    | FOREIGN KEY     |
| tbl_activity_participant    | PRIMARY                        | PRIMARY KEY     |
| tbl_activity_participant    | uq_activity_participant        | UNIQUE          |
| tbl_app_user                | fk_app_user_created_by         | FOREIGN KEY     |
| tbl_app_user                | fk_app_user_updated_by         | FOREIGN KEY     |
| tbl_app_user                | PRIMARY                        | PRIMARY KEY     |
| tbl_app_user                | uq_app_user_email              | UNIQUE          |
| tbl_ca_member               | fk_ca_member_created_by        | FOREIGN KEY     |
| tbl_ca_member               | fk_ca_member_updated_by        | FOREIGN KEY     |
| tbl_ca_member               | PRIMARY                        | PRIMARY KEY     |
| tbl_ca_member_fact          | fk_member_fact_created_by      | FOREIGN KEY     |
| tbl_ca_member_fact          | fk_member_fact_member          | FOREIGN KEY     |
| tbl_ca_member_fact          | fk_member_fact_updated_by      | FOREIGN KEY     |
| tbl_ca_member_fact          | PRIMARY                        | PRIMARY KEY     |
| tbl_campaign_goal           | fk_goal_created_by             | FOREIGN KEY     |
| tbl_campaign_goal           | PRIMARY                        | PRIMARY KEY     |
| tbl_dnd                     | fk_dnd_created_by              | FOREIGN KEY     |
| tbl_dnd                     | fk_dnd_removed_by              | FOREIGN KEY     |
| tbl_dnd                     | fk_dnd_updated_by              | FOREIGN KEY     |
| tbl_dnd                     | fk_dnd_voter                   | FOREIGN KEY     |
| tbl_dnd                     | PRIMARY                        | PRIMARY KEY     |
| tbl_dnd                     | uq_dnd_voter                   | UNIQUE          |
| tbl_institute_details       | fk_institute_created_by        | FOREIGN KEY     |
| tbl_institute_details       | fk_institute_updated_by        | FOREIGN KEY     |
| tbl_institute_details       | PRIMARY                        | PRIMARY KEY     |
| tbl_member_education        | fk_member_education_created_by | FOREIGN KEY     |
| tbl_member_education        | fk_member_education_member     | FOREIGN KEY     |
| tbl_member_education        | fk_member_education_updated_by | FOREIGN KEY     |
| tbl_member_education        | PRIMARY                        | PRIMARY KEY     |
| tbl_member_emails           | fk_member_emails_created_by    | FOREIGN KEY     |
| tbl_member_emails           | fk_member_emails_member        | FOREIGN KEY     |
| tbl_member_emails           | fk_member_emails_updated_by    | FOREIGN KEY     |
| tbl_member_emails           | PRIMARY                        | PRIMARY KEY     |
| tbl_member_phones           | fk_member_phones_created_by    | FOREIGN KEY     |
| tbl_member_phones           | fk_member_phones_member        | FOREIGN KEY     |
| tbl_member_phones           | fk_member_phones_updated_by    | FOREIGN KEY     |
| tbl_member_phones           | PRIMARY                        | PRIMARY KEY     |
| tbl_member_social_profiles  | fk_social_created_by           | FOREIGN KEY     |
| tbl_member_social_profiles  | fk_social_member               | FOREIGN KEY     |
| tbl_member_social_profiles  | fk_social_updated_by           | FOREIGN KEY     |
| tbl_member_social_profiles  | PRIMARY                        | PRIMARY KEY     |
| tbl_member_social_profiles  | uq_social_member_platform      | UNIQUE          |
| tbl_org_details             | fk_org_created_by              | FOREIGN KEY     |
| tbl_org_details             | fk_org_updated_by              | FOREIGN KEY     |
| tbl_org_details             | PRIMARY                        | PRIMARY KEY     |
| tbl_org_details             | uq_org_reg_no                  | UNIQUE          |
| tbl_user_auth               | fk_user_auth_user              | FOREIGN KEY     |
| tbl_user_auth               | PRIMARY                        | PRIMARY KEY     |
| tbl_voter                   | fk_voter_created_by            | FOREIGN KEY     |
| tbl_voter                   | fk_voter_member                | FOREIGN KEY     |
| tbl_voter                   | fk_voter_updated_by            | FOREIGN KEY     |
| tbl_voter                   | PRIMARY                        | PRIMARY KEY     |
| tbl_voter                   | uq_voter_year_voterid          | UNIQUE          |
| tbl_voter_education_history | fk_edu_voter                   | FOREIGN KEY     |
| tbl_voter_education_history | fk_edu_created_by              | FOREIGN KEY     |
| tbl_voter_education_history | fk_edu_institute               | FOREIGN KEY     |
| tbl_voter_education_history | fk_edu_org                     | FOREIGN KEY     |
| tbl_voter_education_history | fk_edu_principal               | FOREIGN KEY     |
| tbl_voter_education_history | fk_edu_updated_by              | FOREIGN KEY     |
| tbl_voter_education_history | PRIMARY                        | PRIMARY KEY     |
| tbl_voter_icai_roles        | fk_roles_created_by            | FOREIGN KEY     |
| tbl_voter_icai_roles        | fk_roles_updated_by            | FOREIGN KEY     |
| tbl_voter_icai_roles        | fk_roles_voter                 | FOREIGN KEY     |
| tbl_voter_icai_roles        | PRIMARY                        | PRIMARY KEY     |
| tbl_voter_preference        | fk_pref_created_by             | FOREIGN KEY     |
| tbl_voter_preference        | fk_pref_updated_by             | FOREIGN KEY     |
| tbl_voter_preference        | fk_pref_voter                  | FOREIGN KEY     |
| tbl_voter_preference        | PRIMARY                        | PRIMARY KEY     |
| tbl_voter_preference        | uq_pref_voter                  | UNIQUE          |
| tbl_work_history            | fk_work_created_by             | FOREIGN KEY     |
| tbl_work_history            | fk_work_org                    | FOREIGN KEY     |
| tbl_work_history            | fk_work_updated_by             | FOREIGN KEY     |
| tbl_work_history            | fk_work_voter                  | FOREIGN KEY     |
| tbl_work_history            | PRIMARY                        | PRIMARY KEY     |
+-----------------------------+--------------------------------+-----------------+
81 rows in set (0.01 sec)

mysql> SELECT
    ->     TABLE_NAME,
    ->     ENGINE,
    ->     TABLE_ROWS,
    ->     CREATE_TIME
    -> FROM information_schema.TABLES
    -> WHERE TABLE_SCHEMA = 'relateme';
+-----------------------------+--------+------------+---------------------+
| TABLE_NAME                  | ENGINE | TABLE_ROWS | CREATE_TIME         |
+-----------------------------+--------+------------+---------------------+
| tbl_activity                | InnoDB |          0 | 2026-06-20 11:15:48 |
| tbl_activity_participant    | InnoDB |          0 | 2026-06-20 11:15:58 |
| tbl_app_user                | InnoDB |          0 | 2026-06-20 11:12:27 |
| tbl_ca_member               | InnoDB |          1 | 2026-06-20 11:12:57 |
| tbl_ca_member_fact          | InnoDB |          1 | 2026-06-20 11:13:08 |
| tbl_campaign_goal           | InnoDB |          1 | 2026-06-20 12:47:31 |
| tbl_dnd                     | InnoDB |          0 | 2026-06-20 11:15:03 |
| tbl_institute_details       | InnoDB |          0 | 2026-06-20 11:14:30 |
| tbl_member_education        | InnoDB |          0 | 2026-06-20 11:14:06 |
| tbl_member_emails           | InnoDB |          0 | 2026-06-20 11:13:43 |
| tbl_member_phones           | InnoDB |          0 | 2026-06-20 11:13:25 |
| tbl_member_social_profiles  | InnoDB |          0 | 2026-06-20 11:13:54 |
| tbl_org_details             | InnoDB |          0 | 2026-06-20 11:14:19 |
| tbl_user_auth               | InnoDB |          1 | 2026-06-20 11:12:43 |
| tbl_voter                   | InnoDB |          1 | 2026-06-20 11:14:40 |
| tbl_voter_education_history | InnoDB |          0 | 2026-06-20 11:15:26 |
| tbl_voter_icai_roles        | InnoDB |          0 | 2026-06-20 11:15:37 |
| tbl_voter_preference        | InnoDB |          1 | 2026-06-20 11:14:52 |
| tbl_work_history            | InnoDB |          0 | 2026-06-20 11:15:15 |
+-----------------------------+--------+------------+---------------------+
19 rows in set (0.04 sec)

mysql> SELECT 'tbl_activity' AS table_name, COUNT(*) FROM tbl_activity
    -> UNION ALL
    -> SELECT 'tbl_activity_participant', COUNT(*) FROM tbl_activity_participant
    -> UNION ALL
    -> SELECT 'tbl_app_user', COUNT(*) FROM tbl_app_user
    -> UNION ALL
    -> SELECT 'tbl_ca_member', COUNT(*) FROM tbl_ca_member
    -> UNION ALL
    -> SELECT 'tbl_ca_member_fact', COUNT(*) FROM tbl_ca_member_fact
    -> UNION ALL
    -> SELECT 'tbl_campaign_goal', COUNT(*) FROM tbl_campaign_goal
    -> UNION ALL
    -> SELECT 'tbl_dnd', COUNT(*) FROM tbl_dnd
    -> UNION ALL
    -> SELECT 'tbl_institute_details', COUNT(*) FROM tbl_institute_details
    -> UNION ALL
    -> SELECT 'tbl_member_education', COUNT(*) FROM tbl_member_education
    -> UNION ALL
    -> SELECT 'tbl_member_emails', COUNT(*) FROM tbl_member_emails
    -> UNION ALL
    -> SELECT 'tbl_member_phones', COUNT(*) FROM tbl_member_phones
    -> UNION ALL
    -> SELECT 'tbl_member_social_profiles', COUNT(*) FROM tbl_member_social_profiles
    -> UNION ALL
    -> SELECT 'tbl_org_details', COUNT(*) FROM tbl_org_details
    -> UNION ALL
    -> SELECT 'tbl_user_auth', COUNT(*) FROM tbl_user_auth
    -> UNION ALL
    -> SELECT 'tbl_voter', COUNT(*) FROM tbl_voter
    -> UNION ALL
    -> SELECT 'tbl_voter_education_history', COUNT(*) FROM tbl_voter_education_history
    -> UNION ALL
    -> SELECT 'tbl_voter_icai_roles', COUNT(*) FROM tbl_voter_icai_roles
    -> UNION ALL
    -> SELECT 'tbl_voter_preference', COUNT(*) FROM tbl_voter_preference
    -> UNION ALL
    -> SELECT 'tbl_work_history', COUNT(*) FROM tbl_work_history;
+-----------------------------+----------+
| table_name                  | COUNT(*) |
+-----------------------------+----------+
| tbl_activity                |        0 |
| tbl_activity_participant    |        0 |
| tbl_app_user                |        1 |
| tbl_ca_member               |        1 |
| tbl_ca_member_fact          |        1 |
| tbl_campaign_goal           |        1 |
| tbl_dnd                     |        0 |
| tbl_institute_details       |        0 |
| tbl_member_education        |        0 |
| tbl_member_emails           |        0 |
| tbl_member_phones           |        0 |
| tbl_member_social_profiles  |        0 |
| tbl_org_details             |        0 |
| tbl_user_auth               |        1 |
| tbl_voter                   |        1 |
| tbl_voter_education_history |        0 |
| tbl_voter_icai_roles        |        0 |
| tbl_voter_preference        |        1 |
| tbl_work_history            |        0 |
+-----------------------------+----------+
19 rows in set (0.03 sec)

mysql> -- ============================================================================
mysql> --  relateme_changes.sql
mysql> --  Additive schema changes for the new features. Run AFTER the main schema
mysql> --  and relateme_extras.sql. Safe to run multiple times.
mysql> --
mysql> --  Adds:
mysql> --    1. cop_status column on tbl_ca_member_fact   (COP = Certificate of Practice)
mysql> --    2. tbl_voter_voting_history                  (per-voter, per-election voted Y/N)
mysql> --    3. tbl_user_universe                         (persistent per-user voter universe)
mysql> --
mysql> --  Existing PVS columns (tbl_voter_preference.pvs_score / pvs_score_previous)
mysql> --  are reused by the scoring engine - no schema change needed for them.
mysql> -- ============================================================================
mysql>
mysql> USE relateme;
Database changed
mysql>
mysql> -- ----------------------------------------------------------------------------
mysql> -- 1. COP status on the ICAI fact table
mysql> --    MySQL has no "ADD COLUMN IF NOT EXISTS", so we guard with a stored check.
mysql> -- ----------------------------------------------------------------------------
mysql> SET @col_exists := (
    ->   SELECT COUNT(*) FROM information_schema.COLUMNS
    ->   WHERE TABLE_SCHEMA = 'relateme'
    ->     AND TABLE_NAME   = 'tbl_ca_member_fact'
    ->     AND COLUMN_NAME  = 'cop_status'
    -> );
Query OK, 0 rows affected (0.04 sec)

mysql> SET @ddl := IF(@col_exists = 0,
    ->   "ALTER TABLE tbl_ca_member_fact
    ">      ADD COLUMN cop_status ENUM('Not Holding','Full Time','Part Time')
    ">      NULL COMMENT 'Certificate of Practice status' AFTER membership_grade",
    ->   "SELECT 'cop_status already exists' AS note"
    -> );
Query OK, 0 rows affected (0.00 sec)

mysql> PREPARE stmt FROM @ddl;
Query OK, 0 rows affected (0.00 sec)
Statement prepared

mysql> EXECUTE stmt;
Query OK, 0 rows affected (0.21 sec)
Records: 0  Duplicates: 0  Warnings: 0

mysql> DEALLOCATE PREPARE stmt;
Query OK, 0 rows affected (0.00 sec)

mysql>
mysql> -- ----------------------------------------------------------------------------
mysql> -- 2. Voting history (drives the Voting-History PVS parameter)
mysql> --    One row per voter per election year. voted = whether they cast a vote.
mysql> -- ----------------------------------------------------------------------------
mysql> CREATE TABLE IF NOT EXISTS tbl_voter_voting_history (
    ->   vh_id            BIGINT       NOT NULL AUTO_INCREMENT,
    ->   voter_record_id  BIGINT       NOT NULL,
    ->   election_year    SMALLINT     NOT NULL,
    ->   voted            ENUM('Y','N') NOT NULL DEFAULT 'N' COMMENT 'Y = cast a vote that year',
    ->   created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ->   created_by       CHAR(36)     DEFAULT NULL,
    ->   updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ->   updated_by       CHAR(36)     DEFAULT NULL,
    ->   PRIMARY KEY (vh_id),
    ->   UNIQUE KEY uq_vh_voter_year (voter_record_id, election_year),
    ->   KEY idx_vh_voter (voter_record_id),
    ->   CONSTRAINT fk_vh_voter FOREIGN KEY (voter_record_id)
    ->     REFERENCES tbl_voter (voter_record_id) ON DELETE CASCADE ON UPDATE CASCADE,
    ->   CONSTRAINT fk_vh_created_by FOREIGN KEY (created_by)
    ->     REFERENCES tbl_app_user (user_id) ON DELETE SET NULL ON UPDATE CASCADE,
    ->   CONSTRAINT fk_vh_updated_by FOREIGN KEY (updated_by)
    ->     REFERENCES tbl_app_user (user_id) ON DELETE SET NULL ON UPDATE CASCADE
    -> ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ->   COMMENT='FACT - per-voter per-election voting record (drives PVS)';
Query OK, 0 rows affected (0.10 sec)

mysql>
mysql> -- ----------------------------------------------------------------------------
mysql> -- 3. Persistent per-user voter universe
mysql> --    Each campaign user has their own working set of voters.
mysql> -- ----------------------------------------------------------------------------
mysql> CREATE TABLE IF NOT EXISTS tbl_user_universe (
    ->   user_id          CHAR(36)  NOT NULL,
    ->   voter_record_id  BIGINT    NOT NULL,
    ->   added_at         DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ->   PRIMARY KEY (user_id, voter_record_id),
    ->   KEY idx_uu_voter (voter_record_id),
    ->   CONSTRAINT fk_uu_user FOREIGN KEY (user_id)
    ->     REFERENCES tbl_app_user (user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    ->   CONSTRAINT fk_uu_voter FOREIGN KEY (voter_record_id)
    ->     REFERENCES tbl_voter (voter_record_id) ON DELETE CASCADE ON UPDATE CASCADE
    -> ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ->   COMMENT='Per-user working universe of voters (persistent)';
Query OK, 0 rows affected (0.06 sec)

mysql>

