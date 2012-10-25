class AddGameFieldsToPlayer < ActiveRecord::Migration
  def self.up
    change_table :players do |t|
      t.integer :times_played
    t.integer :games_won
    end
  end

  def self.down
    change_table :players do |t|
      t.remove :times_played
    t.remove :games_won
    end
  end
end
