class AddDefaultValueToPlayerGamesWon < ActiveRecord::Migration
  def self.up
    change_column :players, :games_won, :integer, :default => 0
    change_column :players, :times_played, :integer, :default => 0
  end

  def self.down
    change_column :players, :games_won, :integer, :default => 0
    change_column :players, :times_played, :integer, :default => 0
  end
end
