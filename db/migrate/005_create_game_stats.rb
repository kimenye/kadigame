class CreateGameStats < ActiveRecord::Migration
  def self.up
    create_table :game_stats do |t|
      t.timestamp :start_time
      t.timestamp :end_time
      t.boolean :elimination
      t.boolean :one_card
      t.boolean :pick_top_card
      t.timestamps
    end
  end

  def self.down
    drop_table :game_stats
  end
end
