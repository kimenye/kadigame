class AddPlayerToGameStats < ActiveRecord::Migration
  def self.up
    change_table :game_stats do |t|
      t.integer :player_id
    end
  end

  def self.down
    change_table :game_stats do |t|
      t.remove :player_id
    end
  end
end
