export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          clerk_user_id: string;
          display_name: string;
          email: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          clerk_user_id: string;
          display_name: string;
          email: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          clerk_user_id?: string;
          display_name?: string;
          email?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      leagues: {
        Row: {
          id: string;
          name: string;
          commissioner_user_id: string;
          invite_code: string;
          status: "pre_draft" | "drafting" | "group_stage" | "knockout_stage" | "completed";
          max_members: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          commissioner_user_id: string;
          invite_code: string;
          status?: "pre_draft" | "drafting" | "group_stage" | "knockout_stage" | "completed";
          max_members?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          commissioner_user_id?: string;
          invite_code?: string;
          status?: "pre_draft" | "drafting" | "group_stage" | "knockout_stage" | "completed";
          max_members?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      league_members: {
        Row: {
          id: string;
          league_id: string;
          user_id: string;
          draft_position: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          league_id: string;
          user_id: string;
          draft_position?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          league_id?: string;
          user_id?: string;
          draft_position?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      teams: {
        Row: {
          id: string;
          name: string;
          country_code: string;
          tier: string;
          group_name: string;
          flag_url: string | null;
        };
        Insert: {
          id: string;
          name: string;
          country_code: string;
          tier: string;
          group_name: string;
          flag_url?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          country_code?: string;
          tier?: string;
          group_name?: string;
          flag_url?: string | null;
        };
        Relationships: [];
      };
      players: {
        Row: {
          id: string;
          name: string;
          team_id: string | null;
          position: string;
          active: boolean;
        };
        Insert: {
          id: string;
          name: string;
          team_id?: string | null;
          position: string;
          active?: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          team_id?: string | null;
          position?: string;
          active?: boolean;
        };
        Relationships: [];
      };
      draft_picks: {
        Row: {
          id: string;
          league_id: string;
          round: number;
          pick_number: number;
          user_id: string;
          pick_type: "team" | "player";
          team_id: string | null;
          player_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          league_id: string;
          round: number;
          pick_number: number;
          user_id: string;
          pick_type: "team" | "player";
          team_id?: string | null;
          player_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          league_id?: string;
          round?: number;
          pick_number?: number;
          user_id?: string;
          pick_type?: "team" | "player";
          team_id?: string | null;
          player_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      rosters: {
        Row: {
          id: string;
          league_id: string;
          user_id: string;
          team_id: string | null;
          player_id: string | null;
          roster_type: "team" | "player";
        };
        Insert: {
          id?: string;
          league_id: string;
          user_id: string;
          team_id?: string | null;
          player_id?: string | null;
          roster_type: "team" | "player";
        };
        Update: {
          id?: string;
          league_id?: string;
          user_id?: string;
          team_id?: string | null;
          player_id?: string | null;
          roster_type?: "team" | "player";
        };
        Relationships: [];
      };
      matches: {
        Row: {
          id: string;
          home_team_id: string;
          away_team_id: string;
          stage: "group" | "r32" | "r16" | "qf" | "sf" | "final";
          kickoff_at: string;
          home_score: number | null;
          away_score: number | null;
          status: "scheduled" | "completed";
        };
        Insert: {
          id?: string;
          home_team_id: string;
          away_team_id: string;
          stage: "group" | "r32" | "r16" | "qf" | "sf" | "final";
          kickoff_at: string;
          home_score?: number | null;
          away_score?: number | null;
          status?: "scheduled" | "completed";
        };
        Update: {
          id?: string;
          home_team_id?: string;
          away_team_id?: string;
          stage?: "group" | "r32" | "r16" | "qf" | "sf" | "final";
          kickoff_at?: string;
          home_score?: number | null;
          away_score?: number | null;
          status?: "scheduled" | "completed";
        };
        Relationships: [];
      };
      league_scores: {
        Row: {
          id: string;
          league_id: string;
          user_id: string;
          phase: "group" | "knockout";
          team_points: number;
          player_points: number;
          total_points: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          league_id: string;
          user_id: string;
          phase: "group" | "knockout";
          team_points?: number;
          player_points?: number;
          total_points?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          league_id?: string;
          user_id?: string;
          phase?: "group" | "knockout";
          team_points?: number;
          player_points?: number;
          total_points?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      league_status: "pre_draft" | "drafting" | "group_stage" | "knockout_stage" | "completed";
      draft_pick_type: "team" | "player";
      roster_type: "team" | "player";
      score_phase: "group" | "knockout";
    };
    CompositeTypes: Record<string, never>;
  };
};
